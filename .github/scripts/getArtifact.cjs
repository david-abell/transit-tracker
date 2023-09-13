module.exports = async ({ github, context, core }) => {
  const owner = context.repo.owner;
  const repo = context.repo.repo;

  const artifacts = await github.rest.actions.listArtifactsForRepo({
    owner,
    repo,
  });

  const artifact = artifacts.data.artifacts.find(
    (artifact) => artifact.name === process.env.ARTIFACT_NAME
  );

  if (artifact) {
    const response = await github.rest.actions.downloadArtifact({
      owner,
      repo,
      artifact_id: artifact.id,
      archive_format: "zip",
    });
    require("fs").writeFileSync(
      process.env.ARTIFACT_FILENAME,
      Buffer.from(response.data)
    );
    require("child_process").execSync(
      `unzip -o ${process.env.ARTIFACT_FILENAME} -d ${process.env.UNZIP_DIR}`
    );

    console.log("Artifact downloaded successfully");
  } else {
    core.setFailed("No artifact found");
  }
};
