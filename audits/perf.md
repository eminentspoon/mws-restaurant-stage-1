# Final Audit Report - Accessibility

**General Notes** - For this testing, the application was hosted in Apache with gzip compression enabled.

## Home Page

**Unthrottled, Clearing Cache**  
![alt text](/performance/home-unthrottled-nocache.png "Home Page Performance Report")  
**Unthrottled, Without Clearing Cache**  
![alt text](/performance/home-unthrottled-withcache.png "Home Page Performance Report")

**Throttled, Clearing Cache**  
![alt text](/performance/home-throttled-nocache.png "Home Page Performance Report")  
**Throttled, Without Clearing Cache**  
![alt text](/performance/home-throttled-withcache.png "Home Page Performance Report")

The performance of the page is reported as 100 for almost all scenarios. The only time that it dips below this is when Lighthouse is told to both throttle and clear the cache at the same time. This then means that the service worker has to recache every resource at the same time as having the CPU and network artificially throttled.

The only reported issues are relating to google maps and the initial core css file (other CSS files have been deferred via javascript).

## Restaurant Page

**Unthrottled, Clearing Cache**  
![alt text](/performance/restaurant-unthrottled-nocache.png "Restaurant Page Performance Report")  
**Unthrottled, Without Clearing Cache**  
![alt text](/performance/restaurant-unthrottled-withcache.png "Restaurant Page Performance Report")

**Throttled, Clearing Cache**  
![alt text](/performance/restaurant-throttled-nocache.png "Restaurant Page Performance Report")  
**Throttled, Without Clearing Cache**  
![alt text](/performance/restaurant-throttled-withcache.png "Restaurant Page Performance Report")

The performance of the page is reported as 100 for almost all scenarios. The only time that it dips below this is when Lighthouse is told to both throttle and clear the cache at the same time. This then means that the service worker has to recache every resource at the same time as having the CPU and network artificially throttled.

The only reported issues are relating to google maps and the initial core css file (other CSS files have been deferred via javascript).
