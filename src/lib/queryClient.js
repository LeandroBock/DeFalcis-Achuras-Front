import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los datos se consideran frescos 30 s: al volver a una pantalla
      // se muestran al instante y se actualizan en segundo plano.
      staleTime: 30_000,
      // Un 401 o un 404 no se arreglan reintentando
      retry: (failureCount, error) =>
        failureCount < 2 && !(error?.status >= 400 && error?.status < 500),
      refetchOnWindowFocus: false,
    },
  },
});
