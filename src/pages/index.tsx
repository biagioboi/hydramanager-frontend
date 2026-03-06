import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { title, subtitle } from "@/components/ui/primitives";
import { GithubIcon } from "@/components/ui/icons";
import AuthPanel from "@/components/auth/auth-panel";
import { siteConfig } from "@/config/site";
import DefaultLayout from "@/layouts/default";

export default function IndexPage() {
  const logo = import.meta.env.VITE_URL_LOGO ?? import.meta.env.URL_LOGO ?? "/hydraclub-logo.jpg";
  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="mt-10 w-full flex flex-col items-center justify-center">
          <img src={logo} alt="Logo" className="w-60 h-32 object-contain mb-2" />
          <AuthPanel onAuth={(creds) => console.log("auth", creds)} />
        </div>
      </section>
    </DefaultLayout>
  );
}
