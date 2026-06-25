import { useCallback, useEffect, useState } from "react";

function useAsyncData(loader, initialState = []) {
  const [data, setData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loader();
      setData(result);
      return result;
    } catch (asyncError) {
      console.error("Async data loader failed:", asyncError);
      setError(asyncError);
      throw asyncError;
    } finally {
      setIsLoading(false);
    }
  }, [loader]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loader();
        if (mounted) {
          setData(result);
        }
      } catch (loadError) {
        if (mounted) {
          console.error("Async data loader failed:", loadError);
          setError(loadError);
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

  return { data, isLoading, error, setData, refetch };
}

export default useAsyncData;
