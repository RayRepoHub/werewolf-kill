/*
 * @Author: YangRui
 * @Date: 2026-05-21 21:47:42
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-25 12:31:09
 * @Description: 请输入
 */
import Vue from 'vue'
import App from './App.vue'

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import "@/scss/global.scss"
import {
  message
} from "@/utils/message"

Vue.config.productionTip = false

Vue.use(ElementUI)
Vue.prototype.$message = message

// 1. 引入所有svg
import './icons.js'
// 2. 引入组件
import SvgIcon from './components/SvgIcon.vue'
// 3. 全局注册
Vue.component('svg-icon', SvgIcon)

new Vue({
  render: h => h(App),
}).$mount('#app')