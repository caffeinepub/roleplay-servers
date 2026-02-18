import { useState, useEffect } from 'react';

export interface RouteParams {
  [key: string]: string;
}

export function useHashRouter() {
  const [currentRoute, setCurrentRoute] = useState<string>('');
  const [params, setParams] = useState<RouteParams>({});

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || '/';
      const [path, queryString] = hash.split('?');
      
      setCurrentRoute(path);
      
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        const newParams: RouteParams = {};
        searchParams.forEach((value, key) => {
          newParams[key] = value;
        });
        setParams(newParams);
      } else {
        setParams({});
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path: string, queryParams?: RouteParams) => {
    let hash = path;
    if (queryParams && Object.keys(queryParams).length > 0) {
      const searchParams = new URLSearchParams(queryParams);
      hash += '?' + searchParams.toString();
    }
    window.location.hash = hash;
  };

  return { currentRoute, params, navigate };
}
