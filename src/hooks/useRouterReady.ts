import { useState, useEffect } from "react";
import { useRouter } from "next/router";

export const useRouterReady = () => {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsReady(router.isReady);
  }, [router.isReady]);

  return isReady;
};
