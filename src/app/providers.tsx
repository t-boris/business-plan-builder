import { Provider as JotaiProvider } from 'jotai';
import { BrowserRouter } from 'react-router';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </JotaiProvider>
  );
}
