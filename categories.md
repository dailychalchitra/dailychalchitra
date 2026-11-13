---
layout: default
title: বিভাগ সমূহ
permalink: /categories/
description: দৈনিক চালচিত্রের সকল বিভাগ ও সেখানে প্রকাশিত লেখার তালিকা।
---

<div style="max-width:800px;margin:20px auto;padding:0 15px;">
  <h1 style="text-align:center;font-size:26px;margin-bottom:10px;">বিভাগ সমূহ</h1>
  <p style="text-align:center;color:#555;margin-bottom:25px;">বিভাগ বেছে নিয়ে সংশ্লিষ্ট সব লেখা দেখুন।</p>

  <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
    {% assign label_groups = site.posts | group_by_exp: "post", "post.category_bn.first | default: post.category_bn | default: post.categories.first" | sort: "name" %}
    {% for group in label_groups %}
    {% if group.name and group.name != "" %}
    <a href="/tag/?name={{ group.name | url_encode }}" style="background:#C00000;color:#fff;padding:7px 14px;border-radius:5px;text-decoration:none;font-size:14px;font-weight:600;">
      {{ group.name }} <span style="opacity:0.8;font-size:12px;">({{ group.items.size }})</span>
    </a>
    {% endif %}
    {% endfor %}
  </div>
</div>
