---
layout: default
title: বিভাগ সমূহ
permalink: /categories/
---

<div style="max-width:800px;margin:20px auto;padding:0 15px;">
  <h1 style="text-align:center;font-size:26px;margin-bottom:25px;">বিভাগ সমূহ</h1>

  <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
    {% assign sorted_cats = site.categories | sort %}
    {% for cat in sorted_cats %}
    {% assign first_post = cat[1] | first %}
    {% assign bn_label = first_post.category_bn.first | default: first_post.category_bn | default: cat[0] %}
    <a href="/tag/?name={{ cat[0] | url_encode }}" style="background:#C00000;color:#fff;padding:7px 14px;border-radius:5px;text-decoration:none;font-size:14px;font-weight:600;">
      {{ bn_label }} <span style="opacity:0.8;font-size:12px;">({{ cat[1].size }})</span>
    </a>
    {% endfor %}
  </div>
</div>
