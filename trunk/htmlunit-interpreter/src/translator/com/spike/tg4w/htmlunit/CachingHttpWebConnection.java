package com.spike.tg4w.htmlunit;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Pattern;

import com.gargoylesoftware.htmlunit.HttpWebConnection;
import com.gargoylesoftware.htmlunit.StringWebResponse;
import com.gargoylesoftware.htmlunit.WebClient;
import com.gargoylesoftware.htmlunit.WebRequestSettings;
import com.gargoylesoftware.htmlunit.WebResponse;


public class CachingHttpWebConnection extends HttpWebConnection {

  private Map cache;
  private Pattern urlsToCache;

  public CachingHttpWebConnection(WebClient webClient, String urlsToCacheRegExp) {
    super(webClient);
    cache = new HashMap();
    urlsToCache = Pattern.compile(urlsToCacheRegExp);
  }

  public WebResponse getResponse(WebRequestSettings webRequestSettings) throws IOException {
    String url = webRequestSettings.getURL().toExternalForm();
    
    if (isCachable(url)) {
      WebResponse result = loadFromCache(url);
      if (result == null) {
        result = cache(url, super.getResponse(webRequestSettings));
      }
      return result;
    }
    
    return super.getResponse(webRequestSettings);
  }

  private boolean isCachable(String url) {
    return urlsToCache.matcher(url).matches();
  }

  private WebResponse cache(String url, WebResponse response) {
    StringWebResponse result = new StringWebResponse(response.getContentAsString(), response.getUrl());
    cache.put(url, result);
    return result;
  }

  private WebResponse loadFromCache(String url) {
    return (WebResponse) cache.get(url);
  }

}
