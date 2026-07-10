---
title: "Running a Web Crawler on a Cloud Server"
description: "Notes on moving a multithreaded web-crawling and upload workload to Google Cloud Platform."
pubDatetime: 2020-04-27T15:59:50.000Z
modDatetime: 2025-02-18T14:33:48.000Z
draft: false
hiddenLocales: ["zh-cn"]
tags: ["Tools", "Web Crawling", "Cloud Computing"]
---

I built a simple web crawler for a site that had no anti-scraping measures, so a straightforward multithreaded loop was sufficient.

The problem was scale: there were roughly 10,000 records, each containing many images, and access was slow over my network in China.

After the crawl finished, all of the data still had to be uploaded to Google Drive.

In practice, processing 10,000 records on my laptop took about 20 hours, followed by another five hours for the upload. That was far too time-consuming.

Although the task was completed, repeating that process every time was not sustainable. I therefore decided to run it on a cloud server.

The result: I created a 24-core machine on Google Cloud Platform. The crawl finished in under four hours, and the upload took another ten minutes. Setting up a command-line Google Drive client required a little additional time.

## Considerations

The crawler's bottleneck was most likely network throughput. Additional CPU cores merely allowed more concurrent threads. Whether it is better to start several small machines or one large machine—and how to compare their costs—is a genuine design question.

Future crawling tasks therefore need to consider whether the work should be distributed across multiple machines. Relevant factors include:

- Cost
- Complexity
- Packaging the final output. I had not yet tried transferring data between multiple disks, so I assumed that each disk's results would need to be packaged independently.

Notes for the next time I build a script like this:

- Design for failures, especially character-encoding problems and then network errors, although the latter should be less common on a cloud server.
- Estimate how the final dataset will be packaged before deciding how to partition the workload across machines.
- Add proper logging to the Python script, preferably with output sent to Google Cloud Logging.
- Automatically destroy compute instances when the script finishes. In practice, at least one machine still needs to remain available for the final upload.
