/*
 * @Author: YangRui
 * @Date: 2026-05-24 17:16:56
 * @LastEditors: YangRui
 * @LastEditTime: 2026-07-05 21:56:06
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

// ====================== 一夜狼人杀技能字典 ======================
export const ONE_NIGHT_SKILL_MAP = {
    // 狼人阵营
    // 可以暂时不做，线下可以用闭眼用动作代替
    // see_wolf_mate: {
    //     label: "狼队友互认",
    //     desc: "夜间可以看见所有其他狼人，知晓队友身份"
    // },
    // know_all_wolf: {
    //     label: "知晓全场狼人",
    //     desc: "爪牙专属，夜间看见全部狼人，但狼人看不到自己"
    // },

    // 信息查看类
    see_two_center: {
        label: "查看两张中央底牌",
        desc: "预言家，夜间查看牌堆中间两张底牌"
    },
    see_one_player: {
        label: "查看一名玩家身份",
        desc: "夜间任选一名其他玩家查看其身份"
    },
    check_self_final: {
        label: "查看自身最终身份",
        desc: "失眠者，夜间最后行动，查看自己当前真实身份"
    },

    // 身份交换类
    rob_swap_player: {
        label: "抢夺互换身份",
        desc: "强盗，与一名玩家互换身份，并查看对方身份"
    },
    swap_two_players: {
        label: "交换两名玩家",
        desc: "捣蛋鬼，偷偷交换场上两名玩家的身份，不查看身份"
    },
    drunk_swap_center: {
        label: "酒鬼置换底牌",
        desc: "强制和中央底牌互换身份，无法查看置换后的身份"
    },

    // 胜利特殊机制
    // win_voted_out: {
    //     label: "被投票出局获胜",
    //     desc: "皮匠，唯一胜利条件是白天被全体投票放逐"
    // },

    // // 出局被动技能
    // hunter_take_away: {
    //     label: "出局带走投票者",
    //     desc: "猎人，若被投票出局，可以带走一名投自己的玩家"
    // },

    // 双人互认
    // see_mason_partner: {
    //     label: "守夜人互认",
    //     desc: "两名守夜人夜间互相看见对方；单张则知道另一张在中央底牌"
    // }
};

// 用于页面v-for循环渲染技能多选框
export const ONE_NIGHT_SKILL_LIST = Object.entries(ONE_NIGHT_SKILL_MAP).map(([skillKey, info]) => ({
    skillKey,
    ...info
}));