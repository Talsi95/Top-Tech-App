import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop Component.
 * Automatically scrolls the window to the top whenever the route changes.
 * This ensures that when navigating to a new page, the user starts from the top.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
