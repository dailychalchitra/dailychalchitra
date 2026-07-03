---
layout: default
title: বিভাগসমূহ
permalink: /categories/
---

<div style="max-width:800px;margin:20px auto;padding:0 15px;">
  <h1 style="text-align:center;font-size:26px;margin-bottom:25px;">বিভাগসমূহ</h1>

  <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
    {% assign sorted_cats = site.categories | sort %}
    {% for cat in sorted_cats %}
    <a href="/tag/?name={{ cat[0] | url_encode }}" style="background:#C00000;color:#fff;padding:7px 14px;border-radius:5px;text-decoration:none;font-size:14px;font-weight:600;">
      {{ cat[0] }} <span style="opacity:0.8;font-size:12px;">({{ cat[1].size }})</span>
    </a>
    {% endfor %}
  </div>
</div>
