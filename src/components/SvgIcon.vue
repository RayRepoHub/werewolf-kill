<!--
 * @Author: YangRui
 * @Date: 2026-06-14 19:52:04
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-14 19:52:07
 * @Description: 请输入
-->
<template>
  <svg class="svg-icon" aria-hidden="true">
    <use :xlink:href="iconName" />
  </svg>
</template>

<script>
export default {
  name: "SvgIcon",
  props: {
    iconClass: {
      type: String,
      required: true,
    },
  },
  computed: {
    iconName() {
      return `#icon-${this.iconClass}`;
    },
  },
};
</script>

<style scoped>
.svg-icon {
  width: 1em;
  height: 1em;
  vertical-align: -0.15em;
  fill: currentColor; /* 能继承 color，和 el-icon 一样 */
}
</style>