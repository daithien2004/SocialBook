import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * `@nestjs/schedule` là ESM thuần nên Jest (require) không nạp được trên Node
 * < 24.9. Spec này chỉ kiểm tra đồ thị import và gating theo process role —
 * decorator cron không liên quan tới bất biến đang test nên mock lại module.
 */
jest.mock('@nestjs/schedule', () => ({
  ScheduleModule: {
    forRoot: () => ({ module: class ScheduleRootModule {} }),
  },
  Cron: () => () => undefined,
  CronExpression: {
    EVERY_10_MINUTES: '*/10 * * * *',
    EVERY_30_SECONDS: '*/30 * * * *',
  },
}));

type ProcessRole = 'worker' | 'api';

interface ProcessorGate {
  modulePath: string;
  exportName: string;
  processorName: string;
  /** Tên queue BullMQ mà `@Processor` khai báo. */
  queueName: string;
  /** Tiến trình DUY NHẤT được phép đăng ký consumer này. */
  expectedIn: ProcessRole;
}

/**
 * A7: API và worker dùng chung image, chỉ khác entry point. Consumer nặng chỉ được
 * đăng ký ở tiến trình worker; consumer cần Socket.IO chỉ được ở lại API.
 *
 * Bảng này phải khớp ĐÚNG tập `@Processor` trong src/ — có test riêng canh việc đó.
 */
const PROCESSOR_GATES: ProcessorGate[] = [
  {
    modulePath:
      '@/modules/chapters/application/chapters/chapters-application.module',
    exportName: 'ChaptersApplicationModule',
    processorName: 'SingleChapterProcessor',
    queueName: 'create-single-chapter',
    expectedIn: 'worker',
  },
  {
    modulePath: '@/modules/chroma/application/chroma-application.module',
    exportName: 'ChromaApplicationModule',
    processorName: 'ChromaProcessor',
    queueName: 'chroma',
    expectedIn: 'worker',
  },
  {
    modulePath:
      '@/modules/chapters/infrastructure/queues/chapters-import/chapters-import.module',
    exportName: 'ChaptersImportModule',
    processorName: 'ChaptersImportProcessor',
    queueName: 'chapters-import',
    expectedIn: 'worker',
  },
  {
    modulePath:
      '@/modules/posts/application/posts/post-moderation.application.module',
    exportName: 'PostModerationApplicationModule',
    processorName: 'PostModerationProcessor',
    queueName: 'post-moderation',
    expectedIn: 'worker',
  },
  {
    modulePath: '@/presentation/gateways/gateways.module',
    exportName: 'GatewaysModule',
    processorName: 'AudioWorker',
    queueName: 'audio-generation',
    expectedIn: 'worker',
  },
  {
    // Cần Socket.IO server để đẩy realtime (NotificationsGateway.afterInit gọi
    // setServer) — chạy ở tiến trình worker sẽ ghi DB mà mất push.
    modulePath: '@/presentation/gateways/gateways.module',
    exportName: 'GatewaysModule',
    processorName: 'NotificationWorker',
    queueName: 'notifications',
    expectedIn: 'api',
  },
];

const SRC_ROOT = join(__dirname, '..', '..', '..', 'src');

/** Nạp một export của module trong env đã cho, không dính cache của lần trước. */
const loadExport = <T>(modulePath: string, exportName: string): T => {
  let loaded: T | undefined;

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const moduleExports = require(modulePath) as Record<string, unknown>;
    loaded = moduleExports[exportName] as T;
  });

  if (loaded === undefined) {
    throw new Error(`${exportName} không được export từ ${modulePath}`);
  }

  return loaded;
};

const getProviderNames = (
  modulePath: string,
  exportName: string,
  workerMode: boolean,
): string[] => {
  const previousWorkerMode = process.env.WORKER_MODE;
  process.env.WORKER_MODE = workerMode ? 'true' : 'false';

  try {
    const moduleClass = loadExport<object>(modulePath, exportName);
    const providers = Reflect.getMetadata('providers', moduleClass) as
      unknown[] | undefined;

    if (!providers) {
      throw new Error(`${exportName} không có metadata 'providers'`);
    }

    return providers
      .filter(
        (provider): provider is { name: string } =>
          typeof provider === 'function',
      )
      .map((provider) => provider.name);
  } finally {
    if (previousWorkerMode === undefined) {
      delete process.env.WORKER_MODE;
    } else {
      process.env.WORKER_MODE = previousWorkerMode;
    }
  }
};

/** Quét src/ tìm mọi class mang `@Processor(` → tên class ánh xạ tới file khai báo. */
const collectProcessorClasses = (): Map<string, string> => {
  const files = readdirSync(SRC_ROOT, {
    recursive: true,
    encoding: 'utf8',
  }).filter((file) => file.endsWith('.ts'));

  const found = new Map<string, string>();

  for (const file of files) {
    const absolutePath = join(SRC_ROOT, file);
    const lines = readFileSync(absolutePath, 'utf8').split('\n');

    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].includes('@Processor(')) {
        continue;
      }

      // `@Processor('x', { concurrency })` có thể viết nhiều dòng, nên phải quét
      // tới trước thay vì chỉ nhìn dòng kế tiếp.
      for (let j = i; j < Math.min(i + 10, lines.length); j++) {
        const match = lines[j].match(/export class (\w+)/);
        if (match) {
          found.set(match[1], absolutePath);
          break;
        }
      }
    }
  }

  return found;
};

/**
 * Đi theo `imports` (kể cả DynamicModule) để biết module nào thật sự được nạp.
 *
 * Đệ quy trên chính class lấy từ metadata — không require lại theo tên, vì một
 * module được import chứ không được export từ file gốc.
 */
const collectReachableModules = (
  rootClass: object,
  seen = new Set<string>(),
): Set<string> => {
  const className = (rootClass as { name: string }).name;
  if (seen.has(className)) {
    return seen;
  }
  seen.add(className);

  const imports = (Reflect.getMetadata('imports', rootClass) ??
    []) as unknown[];

  for (const entry of imports) {
    const candidate =
      entry && typeof entry === 'object' && 'module' in entry
        ? entry.module
        : entry;

    if (typeof candidate !== 'function') {
      continue;
    }

    collectReachableModules(candidate, seen);
  }

  return seen;
};

describe('A7 — gate BullMQ consumer theo vai trò tiến trình', () => {
  describe.each(PROCESSOR_GATES)(
    '$processorName trong $exportName',
    ({ modulePath, exportName, processorName, queueName, expectedIn }) => {
      it(`được đăng ký khi chạy ở tiến trình ${expectedIn}`, () => {
        const providers = getProviderNames(
          modulePath,
          exportName,
          expectedIn === 'worker',
        );
        expect(providers).toContain(processorName);
      });

      it('không được đăng ký ở tiến trình còn lại', () => {
        const providers = getProviderNames(
          modulePath,
          exportName,
          expectedIn !== 'worker',
        );
        expect(providers).not.toContain(processorName);
        // Không assert `providers.length > 0` ở đây: vài module (ChaptersImport,
        // PostModeration) chỉ có đúng processor làm provider, nên ở API mode mảng
        // rỗng là ĐÚNG. Chống pass rỗng nằm ở chỗ khác — `loadExport` ném lỗi khi
        // không resolve được export, và `getProviderNames` ném lỗi khi class không
        // có metadata 'providers'.
      });

      it(`mang metadata @Processor cho queue "${queueName}"`, () => {
        const processorClasses = collectProcessorClasses();
        const processorFile = processorClasses.get(processorName);

        expect(processorFile).toBeDefined();

        const processorClass = loadExport<object>(
          processorFile as string,
          processorName,
        );
        const metadata = Reflect.getMetadata(
          'bullmq:processor_metadata',
          processorClass,
        ) as { name?: string } | undefined;

        // Đây chính là metadata mà BullMetadataAccessor.isProcessor() đọc lúc
        // bootstrap. Xoá `@Processor(...)` khỏi class mà giữ nó trong providers
        // thì test "có trong providers" vẫn xanh, nhưng không worker nào mở
        // kết nối — job nằm im. Assert metadata mới bắt được ca đó.
        expect(metadata?.name).toBe(queueName);
      });
    },
  );

  it('mọi @Processor trong src đều có mặt trong PROCESSOR_GATES', () => {
    const declared = [...collectProcessorClasses().keys()];
    const gated = PROCESSOR_GATES.map((gate) => gate.processorName);

    // Thêm một consumer mới mà quên gate = nó chạy trên MỌI replica API.
    expect(declared.length).toBeGreaterThan(0);
    expect(new Set(declared)).toEqual(new Set(gated));
  });

  it('worker-mode đặt WORKER_MODE=true', () => {
    const previousWorkerMode = process.env.WORKER_MODE;
    delete process.env.WORKER_MODE;

    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('@/worker-mode');
      });
      expect(process.env.WORKER_MODE).toBe('true');
    } finally {
      if (previousWorkerMode === undefined) {
        delete process.env.WORKER_MODE;
      } else {
        process.env.WORKER_MODE = previousWorkerMode;
      }
    }
  });

  it('worker.ts nạp worker-mode TRƯỚC app.module', () => {
    const source = readFileSync(
      join(__dirname, '..', '..', '..', 'src', 'worker.ts'),
      'utf8',
    );

    const markerIndex = source.indexOf("'./worker-mode'");
    const appModuleIndex = source.indexOf("'./app.module'");

    expect(markerIndex).toBeGreaterThanOrEqual(0);
    expect(appModuleIndex).toBeGreaterThanOrEqual(0);
    // Đảo thứ tự 2 import này sẽ khiến worker không đăng ký consumer nào —
    // lỗi im lặng, chỉ lộ ra khi job không bao giờ chạy.
    expect(markerIndex).toBeLessThan(appModuleIndex);
  });

  it('worker.ts không mở cổng HTTP', () => {
    const source = readFileSync(
      join(__dirname, '..', '..', '..', 'src', 'worker.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/\.listen\s*\(/);
  });
});

describe('A7 — isWorkerProcess chỉ bật với đúng chuỗi "true"', () => {
  const original = process.env.WORKER_MODE;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.WORKER_MODE;
    } else {
      process.env.WORKER_MODE = original;
    }
  });

  it.each([
    ['không set', undefined],
    ['false', 'false'],
    ['1', '1'],
    ['TRUE', 'TRUE'],
    ['yes', 'yes'],
    ['chuỗi rỗng', ''],
  ])('trả false khi WORKER_MODE là %s', (_label, value) => {
    if (value === undefined) {
      delete process.env.WORKER_MODE;
    } else {
      process.env.WORKER_MODE = value;
    }

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isWorkerProcess } = require('@/common/utils/process-role.util') as {
      isWorkerProcess: () => boolean;
    };

    // Sai ở đây là sai theo hướng nguy hiểm: API replica bị biến thành worker.
    expect(isWorkerProcess()).toBe(false);
  });

  it('main.ts từ chối chạy khi ở worker mode', () => {
    const source = readFileSync(
      join(__dirname, '..', '..', '..', 'src', 'main.ts'),
      'utf8',
    );
    expect(source).toMatch(/isWorkerProcess\(\)/);
    expect(source).toMatch(/throw new Error/);
  });
});

describe('A7 — module bị gate phải reachable từ module gốc', () => {
  it.each(
    PROCESSOR_GATES.filter((gate) =>
      gate.modulePath.includes('application/'),
    ).map((gate) => [gate.exportName, gate.modulePath] as const),
  )('%s reachable từ ApplicationModule', (exportName) => {
    // Xoá module khỏi cây imports thì consumer không được đăng ký ở đâu cả:
    // job vẫn được enqueue nhưng không bao giờ chạy, không log, không lỗi.
    const reachable = collectReachableModules(
      loadExport<object>(
        '@/application/application.module',
        'ApplicationModule',
      ),
    );

    expect(reachable.has(exportName)).toBe(true);
  });

  it('ChaptersImportModule và GatewaysModule reachable từ module gốc của chúng', () => {
    // GatewaysModule nằm sau PresentationModule → kéo @nestjs/terminus (ESM-only)
    // nên không require được dưới jest config hiện tại; kiểm bằng source text.
    const presentationSource = readFileSync(
      join(SRC_ROOT, 'presentation', 'presentation.module.ts'),
      'utf8',
    );
    expect(presentationSource).toMatch(/GatewaysModule/);

    const infrastructureSource = readFileSync(
      join(SRC_ROOT, 'infrastructure', 'infrastructure.module.ts'),
      'utf8',
    );
    expect(infrastructureSource).toMatch(/ChaptersImportModule/);
  });
});
