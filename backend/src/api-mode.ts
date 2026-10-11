/**
 * Must load before AppModule. Feature modules read the process role while
 * their @Module metadata is evaluated, so the API entry point declares its
 * role before any application module is imported.
 */
process.env.WORKER_MODE = 'false';

export {};
