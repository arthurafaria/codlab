// Site estático para GitHub Pages: sem servidor, sem banco, sem API.
// O basePath vem do workflow (/codlab em Pages de projeto) e fica vazio no dev.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
