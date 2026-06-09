/*
 * @Author: YangRui
 * @Date: 2026-05-24 17:16:56
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-09 22:13:04
 * @Description: 常量配置
 */

// 管理员密码
export const ADMIN_PASSWORD = "970611";

// 主持人的名称
export const GOD_NAME = "上帝";

// 后端服务配置（全部统一在这里管理）
export const API_SERVERS = {
    default: "replit",
    list: {
        local: {
            name: "局域网",
            url: "http://192.168.0.104:3000",
            desc: "仅限同一WiFi下使用"
        },
        vercel: {
            name: "Vercel",
            url: "https://werewolf-kill-server.vercel.app",
            desc: "国外服务，偶尔卡顿"
        },
        replit: {
            name: "Replit",
            url: "https://6eab61fd-289f-4496-8661-7e653ebe7104-00-3im5epkvmlqy1.pike.replit.dev/api",
            desc: "默认推荐，稳定流畅"
        }
    }
};