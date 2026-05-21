/*
 * @Author: YangRui
 * @Date: 2026-05-21 21:47:42
 * @LastEditors: YangRui
 * @LastEditTime: 2026-05-21 21:52:17
 * @Description: 请输入
 */
import Vue from 'vue'
import App from './App.vue'

import ElementUI from 'element-ui';
import 'element-ui/lib/theme-chalk/index.css';

Vue.config.productionTip = false

Vue.use(ElementUI)

new Vue({
  render: h => h(App),
}).$mount('#app')
