import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { deployments } from "../../shared/schema.js";

interface HostsblueDeployConfig {
  apiUrl: string;
  serviceToken: string;
}

interface DeployResult {
  hostingAccountId: string;
  deployedUrl: string;
  status: string;
}

const config: HostsblueDeployConfig = {
  apiUrl: process.env.HOSTSBLUE_API_URL || "https://hostsblue.com/api/v1",
  serviceToken: process.env.HOSTSBLUE_SERVICE_TOKEN || "",
};

export async function deployToHostsblue(
  deploymentId: string,
  project: { id: string; name: string; userId: string },
  files: { path: string; content: string; language: string }[],
  planSlug: string
): Promise<DeployResult> {
  // Step 1: Building
  await updateDeploymentStatus(deploymentId, "building", "Building project...");

  // Detect if this is a buildable project
  const packageJson = files.find((f) => f.path === "package.json");
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson.content);
      if (pkg.scripts?.build) {
        await updateDeploymentStatus(
          deploymentId,
          "building",
          "Packaging project files..."
        );
      }
    } catch {
      // not valid JSON, deploy as-is
    }
  }

  // Step 2: Deploy to hostsblue
  await updateDeploymentStatus(deploymentId, "deploying", "Deploying to hostsblue.com...");

  const response = await fetch(`${config.apiUrl}/deploy/builderblue`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.serviceToken}`,
    },
    body: JSON.stringify({
      projectId: project.id,
      projectName: project.name,
      builderblueUserId: project.userId,
      planSlug,
      files: files.map((f) => ({
        path: f.path,
        content: f.content,
      })),
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`hostsblue deploy failed: ${response.status} — ${errText}`);
  }

  const result = await response.json();

  // Step 3: Success
  await updateDeploymentStatus(
    deploymentId,
    "deployed",
    "Deployed successfully",
    result.data.deployedUrl
  );

  return {
    hostingAccountId: result.data.hostingAccountId,
    deployedUrl: result.data.deployedUrl,
    status: "deployed",
  };
}

async function updateDeploymentStatus(
  deploymentId: string,
  status: string,
  log: string,
  deployedUrl?: string
): Promise<void> {
  await db
    .update(deployments)
    .set({
      status,
      buildLog: log,
      ...(deployedUrl ? { deployedUrl, deployedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(deployments.id, deploymentId));
}

export async function buildProjectZip(
  files: { path: string; content: string }[]
): Promise<Buffer> {
  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip();

  for (const file of files) {
    zip.addFile(file.path, Buffer.from(file.content, "utf-8"));
  }

  return zip.toBuffer();
}
