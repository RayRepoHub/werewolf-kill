/*
 * @Author: YangRui
 * @Date: 2026-05-21 21:47:42
 * @LastEditors: YangRui
 * @LastEditTime: 2026-05-31 13:29:40
 * @Description: 请输入
 */
import Vue from 'vue'
import App from './App.vue'

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';
import "@/scss/global.scss"

Vue.config.productionTip = false

Vue.use(ElementUI)

new Vue({
  render: h => h(App),
}).$mount('#app')
