import { useEffect, useState } from "react";

function useMockAsyncData(loader, initialState = []) {
  const [data, setData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const result = await loader();
        if (mounted) {
          setData(result);
        }
      } catch (error) {
        if (mounted) {
          console.error("Async data loader failed:", error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [loader]);

  return { data, isLoading, setData };
}

export default useMockAsyncData;
