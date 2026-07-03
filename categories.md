---
layout: default
title: বিভাগসমূহ
permalink: /categories/
---

<div style="max-width:800px;margin:20px auto;padding:0 15px;">
  <h1 style="text-align:center;font-size:26px;margin-bottom:25px;">বিভাগসমূহ</h1>

  <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;">
    {% assign sorted_tags = site.tags | sort %}
    {% for tag in sorted_tags %}
    <a href="/tag/?name={{ tag[0] | url_encode }}" style="background:#C00000;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:600;">
      {{ tag[0] }} <span style="opacity:0.8;font-size:13px;">({{ tag[1].size }})</span>
    </a>
    {% endfor %}
  </div>
</div>
