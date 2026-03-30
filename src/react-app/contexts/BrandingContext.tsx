import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiUrl } from "@/react-app/utils/api";

export const DEFAULT_APP_NAME = "FocusFlow";
/** Shown on the pricing page when admin leaves the field blank. */
export const DEFAULT_FREE_PRICE_LABEL = "Free";
export const DEFAULT_PRO_PRICE_LABEL = "$9/month";
export const DEFAULT_ENTERPRISE_PRICE_DISPLAY = "$29/month";

/** `full_logo` = image already includes name; `icon_plus_name` = mark + separate app name. */
export type LogoDisplayMode = "full_logo" | "icon_plus_name";

/** Avoid stale browser cache when the same `/api/branding/asset/...` path is re-uploaded. */
export function cacheBustBrandingAssetUrl(
  url: string,
  bustToken: number | string = Date.now()
): string {
  const u = url.trim();
  if (!u) return u;
  const pathOnly = u.split("?")[0] ?? u;
  if (!pathOnly.includes("/api/branding/asset/")) {
    return u;
  }
  const sep = u.includes("?") ? "&" : "?";
  return `${u}${sep}v=${bustToken}`;
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export type BrandingState = {
  appName: string;
  logoUrl: string | null;
  logoDisplayMode: LogoDisplayMode;
  /** Contact email from admin (Email). Used for upgrade and pricing mailto links. */
  clientEmail: string | null;
  enterprisePriceDisplay: string | null;
  pricingFreeDisplay: string | null;
  pricingProDisplay: string | null;
  freePriceLabel: string;
  proPriceLabel: string;
  enterprisePriceLabel: string;
  loaded: boolean;
  refresh: () => Promise<void>;
  replaceAppName: (text: string) => string;
};

const BrandingContext = createContext<BrandingState | undefined>(undefined);

export function useBranding() {
  const ctx = useContext(BrandingContext);
  if (!ctx) {
    throw new Error("useBranding must be used within BrandingProvider");
  }
  return ctx;
}

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [appName, setAppName] = useState(DEFAULT_APP_NAME);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoDisplayMode, setLogoDisplayMode] = useState<LogoDisplayMode>("icon_plus_name");
  const [clientEmail, setClientEmail] = useState<string | null>(null);
  const [enterprisePriceDisplay, setEnterprisePriceDisplay] = useState<string | null>(null);
  const [pricingFreeDisplay, setPricingFreeDisplay] = useState<string | null>(null);
  const [pricingProDisplay, setPricingProDisplay] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const staticSocialImages = useRef<{ og: string | null; twitter: string | null }>({
    og: null,
    twitter: null,
  });

  useLayoutEffect(() => {
    if (staticSocialImages.current.og !== null) return;
    staticSocialImages.current = {
      og: document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? null,
      twitter:
        document.querySelector('meta[property="twitter:image"]')?.getAttribute("content") ?? null,
    };
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("api/branding"), {
        credentials: "omit",
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setAppName(typeof data.app_name === "string" && data.app_name.trim() ? data.app_name.trim() : DEFAULT_APP_NAME);
        const rawLogo =
          typeof data.logo_url === "string" && data.logo_url.trim() ? data.logo_url.trim() : null;
        setLogoUrl(rawLogo ? cacheBustBrandingAssetUrl(rawLogo) : null);
        setLogoDisplayMode(
          data.logo_display_mode === "full_logo" ? "full_logo" : "icon_plus_name"
        );
        setClientEmail(
          typeof data.support_email === "string" && data.support_email.trim()
            ? data.support_email.trim()
            : null
        );
        setEnterprisePriceDisplay(
          typeof data.enterprise_price_display === "string" && data.enterprise_price_display.trim()
            ? data.enterprise_price_display.trim()
            : null
        );
        setPricingFreeDisplay(
          typeof data.pricing_free_label === "string" && data.pricing_free_label.trim()
            ? data.pricing_free_label.trim()
            : null
        );
        setPricingProDisplay(
          typeof data.pricing_pro_label === "string" && data.pricing_pro_label.trim()
            ? data.pricing_pro_label.trim()
            : null
        );
      }
    } catch {
      // keep defaults
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    document.title = appName;
    setMetaProperty("og:title", appName);
    setMetaProperty("og:site_name", appName);
    setMetaProperty("twitter:title", appName);

    if (logoUrl) {
      const absIcon = new URL(logoUrl, window.location.origin).href;
      setMetaProperty("og:image", absIcon);
      setMetaProperty("twitter:image", absIcon);
      document
        .querySelectorAll<HTMLLinkElement>(
          "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']"
        )
        .forEach((link) => {
          link.href = absIcon;
        });
    } else {
      const { og, twitter } = staticSocialImages.current;
      if (og) setMetaProperty("og:image", og);
      if (twitter) setMetaProperty("twitter:image", twitter);
    }
  }, [appName, logoUrl]);

  const replaceAppName = useCallback(
    (text: string) => text.replaceAll(DEFAULT_APP_NAME, appName),
    [appName]
  );

  const freePriceLabel = pricingFreeDisplay?.trim() || DEFAULT_FREE_PRICE_LABEL;
  const proPriceLabel = pricingProDisplay?.trim() || DEFAULT_PRO_PRICE_LABEL;
  const enterprisePriceLabel =
    enterprisePriceDisplay?.trim() || DEFAULT_ENTERPRISE_PRICE_DISPLAY;

  const value = useMemo<BrandingState>(
    () => ({
      appName,
      logoUrl,
      logoDisplayMode,
      clientEmail,
      enterprisePriceDisplay,
      pricingFreeDisplay,
      pricingProDisplay,
      freePriceLabel,
      proPriceLabel,
      enterprisePriceLabel,
      loaded,
      refresh,
      replaceAppName,
    }),
    [
      appName,
      logoUrl,
      logoDisplayMode,
      clientEmail,
      enterprisePriceDisplay,
      pricingFreeDisplay,
      pricingProDisplay,
      freePriceLabel,
      proPriceLabel,
      enterprisePriceLabel,
      loaded,
      refresh,
      replaceAppName,
    ]
  );

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
}
