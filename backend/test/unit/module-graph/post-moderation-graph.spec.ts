const POST_MODERATION_MODULE_PATH =
  '@/infrastructure/queues/post-moderation/post-moderation.module';
const POSTS_APPLICATION_MODULE_PATH =
  '@/application/posts/posts-application.module';

const getImports = (moduleClass: unknown): unknown[] => {
  const imports = Reflect.getMetadata('imports', moduleClass as object);
  return Array.isArray(imports) ? imports : [];
};

describe('Post moderation module graph', () => {
  it('should not leave undefined imports when post-moderation module loads first', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require(POST_MODERATION_MODULE_PATH);
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PostsApplicationModule } = require(POSTS_APPLICATION_MODULE_PATH);

      const undefinedImports = getImports(PostsApplicationModule).filter(
        (imported) => imported === undefined,
      );

      expect(undefinedImports).toHaveLength(0);
    });
  });

  it('should keep the queue module free of application dependencies', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PostModerationQueueModule } = require(
        POST_MODERATION_MODULE_PATH,
      );

      const applicationModules = getImports(PostModerationQueueModule).filter(
        (imported) =>
          typeof imported === 'function' &&
          (imported as { name?: string }).name?.includes('ApplicationModule'),
      );

      expect(applicationModules).toHaveLength(0);
    });
  });
});
