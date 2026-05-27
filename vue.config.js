/*
 * @Author: YangRui
 * @Date: 2026-05-21 21:47:42
 * @LastEditors: YangRui
 * @LastEditTime: 2026-05-27 19:46:02
 * @Description: 请输入
 */
const {
  defineConfig
} = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: './',
  // 想要项目运行后自动打开浏览器，可以配置如下
  devServer: {
    open: true, // 自动打开浏览器
    port: 8088 // 指定端口号
  }
})