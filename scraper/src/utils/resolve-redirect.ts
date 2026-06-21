export async function resolveRedirect(url: string, maxRedirects = 5): Promise<string> {
  // If it's not a shortener or redirect link, we don't need to resolve it
  if (!url || (!url.includes("amzn.to") && !url.includes("tidd.ly") && !url.includes("bit.ly") && !url.includes("promos.lucasishii.com.br"))) {
    return url;
  }

  try {
    // Perform a HEAD request and follow redirects
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      }
    });
    return res.url;
  } catch (err) {
    // Fallback to GET if HEAD is not supported by the endpoint
    try {
      const res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
      });
      return res.url;
    } catch (e) {
      return url;
    }
  }
}
