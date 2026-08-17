import { Button } from "@/components/ui/button";
import { useLang } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Link } from "react-router";

export default function NotFound() {
  const { t } = useLang();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-5xl mx-auto relative px-4">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-foreground mb-4">404</h1>
              <p className="text-lg text-muted-foreground">{t("nf.title")}</p>
              <p className="mt-2 text-sm text-muted-foreground/80">{t("nf.body")}</p>
              <Button asChild variant="outline" className="mt-6 rounded-xl">
                <Link to="/">{t("nf.home")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
