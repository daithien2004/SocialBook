// @t3-oss/env-nextjs là pure ESM, Jest (CJS) không require() được file dist.
// Jest tự áp dụng manual mock này cho node_modules; test chỉ cần đọc biến từ runtimeEnv.

const createEnv = ({ server = {}, client = {}, runtimeEnv = {} }) => {
  const env = {};
  for (const key of [...Object.keys(server), ...Object.keys(client)]) {
    env[key] = runtimeEnv[key] ?? process.env[key];
  }
  return env;
};

module.exports = { createEnv };