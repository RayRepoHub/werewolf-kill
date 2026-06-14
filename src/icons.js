/*
 * @Author: YangRui
 * @Date: 2026-06-14 19:52:51
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-14 19:53:07
 * @Description: 请输入
 */
// src/icons.js
const req = require.context('./assets/icons', false, /\.svg$/)
req.keys().forEach(req)