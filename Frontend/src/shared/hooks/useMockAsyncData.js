import { useEffect, useState } from "react";

function useMockAsyncData(loader, initialState = []) {
  const [data, setData] = useState(initialState);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    loader().then((result) => {
      if (mounted) {
        setData(result);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, [loader]);

  return { data, isLoading, setData };
}

export default useMockAsyncData;
