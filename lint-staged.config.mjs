const quoteFile = (file) => `"${file.replaceAll('"', '\\"')}"`;

const workspaceTask = (workspace, command, files) => {
  const relativeFiles = files.map((file) => file.slice(workspace.length + 1));

  return `npm exec --workspace=${workspace} -- ${command} ${relativeFiles.map(quoteFile).join(' ')}`;
};

const prettierTask = (files) =>
  `prettier --write ${files.map(quoteFile).join(' ')}`;

export default (stagedFiles) => {
  const tasks = [];
  const backendFiles = stagedFiles.filter(
    (file) => file.startsWith('backend/') && file.endsWith('.ts'),
  );
  const frontendFiles = stagedFiles.filter(
    (file) =>
      file.startsWith('frontend/') &&
      (file.endsWith('.ts') || file.endsWith('.tsx')),
  );
  const sharedFiles = stagedFiles.filter(
    (file) => file.startsWith('shared/') && file.endsWith('.ts'),
  );

  if (backendFiles.length > 0) {
    tasks.push(workspaceTask('backend', 'eslint --fix', backendFiles));
    tasks.push(prettierTask(backendFiles));
  }
  if (frontendFiles.length > 0) {
    tasks.push(workspaceTask('frontend', 'eslint --fix', frontendFiles));
    tasks.push(prettierTask(frontendFiles));
  }
  if (sharedFiles.length > 0) {
    tasks.push(prettierTask(sharedFiles));
  }

  return tasks;
};
