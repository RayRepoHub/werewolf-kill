<!--
 * @Author: YangRui
 * @Date: 2026-06-28 22:24:08
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-30 00:15:33
 * @Description: 请输入
-->
<template>
  <el-dialog
    title="技能操作"
    :visible="visible"
    @close="handleClose"
    :fullscreen="true"
    :show-close="false"
    append-to-body
    :close-on-click-modal="false"
    class="full-screen-dialog"
  >
    <!-- 互斥身份：先选择要使用的技能 -->
    <div v-if="needSelectSkill">
      <p style="margin-bottom: 16px">
        该身份技能互斥，本局仅可使用其中一项，请选择要发动的技能
      </p>
      <el-radio-group v-model="selectSkillKey">
        <el-radio v-for="sk in showSkillList" :key="sk" :label="sk">
          {{ ONE_NIGHT_SKILL_MAP[sk]?.label }}
        </el-radio>
      </el-radio-group>
    </div>

    <!-- 查验一名玩家 -->
    <div v-else-if="currentSkillKey === 'see_one_player'">
      <p style="margin-bottom: 12px">请输入你要查验的玩家序号</p>
      <el-input
        v-model="checkSeq"
        placeholder="输入数字序号"
        type="number"
      ></el-input>
    </div>

    <!-- 查看两张底牌（未分配出去的身份） -->
    <div v-else-if="currentSkillKey === 'see_two_center'">
      <p style="margin-bottom: 12px">
        本局剩余未抽取底牌如下（自动展示最多2张）
      </p>
      <div v-if="centerRoleList.length > 0" class="center-role-box">
        <div v-for="r in centerRoleList" :key="r" class="role-item">？</div>
      </div>
      <div v-else>暂无剩余底牌</div>
    </div>

    <!-- 后续其他技能在这里扩展 -->
    <div v-else>
      <p>该技能暂无交互弹窗</p>
    </div>

    <div slot="footer" class="dialog-footer">
      <div class="flex-end" v-if="!needSelectSkill">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确认</el-button>
      </div>
      <div class="flex-end" v-if="needSelectSkill">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="confirmSelectSkill"
          :disabled="!selectSkillKey"
        >
          确认
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { ONE_NIGHT_SKILL_MAP } from "@/const.js";
export default {
  name: "SkillDialog",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    skillKey: {
      type: String,
      default: "",
    },
    // 当前玩家完整信息
    targetPlayer: {
      type: Object,
      default: () => ({}),
    },
    // 所有玩家完整列表，用来查身份
    allPlayers: {
      type: Array,
      default: () => [],
    },
    // 全局身份配置（父组件传入 gameRoles）
    gameRoles: {
      type: Object,
      default: () => ({}),
    },
    // 全局全部身份配置列表
    allRoleConfig: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      ONE_NIGHT_SKILL_MAP,
      checkSeq: "",
      // 互斥技能选择临时变量
      needSelectSkill: false,
      selectSkillKey: "",
      selfSkillList: [],
      currentSkillKey: "",
    };
  },
  watch: {
    visible(val) {
      if (val) {
        // 弹窗打开初始化
        this.checkSeq = "";
        this.needSelectSkill = false;
        this.selectSkillKey = "";
        this.selfSkillList = [];
        this.currentSkillKey = "";

        // 1. 获取当前玩家身份配置
        const playerRole = this.targetPlayer.role;
        const roleInfo = this.allRoleConfig.find(
          (item) => item.name === playerRole
        );
        if (!roleInfo) {
          this.currentSkillKey = this.skillKey;
          return;
        }
        // 2. 判断是否互斥多技能
        if (roleInfo.singleSkill && roleInfo.skills.length > 1) {
          this.needSelectSkill = true;
          this.selfSkillList = [...roleInfo.skills];
        } else {
          // 非互斥/单技能，直接进入原面板
          this.currentSkillKey = this.skillKey;
        }
      }
    },
  },
  computed: {
    showSkillList() {
      const allSkill = this.selfSkillList;
      const usedSkill = this.targetPlayer.usedSkillKeys || [];
      const leaveSkill = allSkill.filter((sk) => !usedSkill.includes(sk));
      return leaveSkill;
    },
    // 计算：未分配给玩家的剩余底牌
    centerRoleList() {
      // 1. 生成本局全部身份池
      let fullPool = [];
      for (const [role, maxNum] of Object.entries(this.gameRoles)) {
        for (let i = 0; i < maxNum; i++) {
          fullPool.push(role);
        }
      }

      // 2. 取出所有已分配给玩家的身份
      const usedRoles = this.allPlayers
        .filter((p) => p.role && p.role !== "")
        .map((p) => p.role);

      // 3. 从总池移除已使用身份，得到剩余底牌
      usedRoles.forEach((role) => {
        const idx = fullPool.indexOf(role);
        if (idx > -1) fullPool.splice(idx, 1);
      });

      // 4. 最多返回2张底牌
      return fullPool.slice(0, 2);
    },
  },
  methods: {
    // 取消：仅关闭弹窗，不消耗技能次数
    handleClose() {
      this.checkSeq = "";
      this.needSelectSkill = false;
      this.selectSkillKey = "";
      this.selfSkillList = [];
      this.currentSkillKey = "";
      this.$emit("update:visible", false);
    },
    // 确认选择互斥技能，切换到对应技能面板
    confirmSelectSkill() {
      this.currentSkillKey = this.selectSkillKey;
      this.needSelectSkill = false;
    },
    handleConfirm() {
      const key = this.currentSkillKey;
      let isValid = true;

      if (key === "see_one_player") {
        const targetSeq = Number(this.checkSeq);
        if (!targetSeq || targetSeq <= 0) {
          this.$message.warning("请输入合法玩家序号");
          isValid = false;
        } else {
          const targetPlayer = this.allPlayers.find((p) => p.seq === targetSeq);
          if (!targetPlayer) {
            this.$message.error("未找到该序号玩家");
            isValid = false;
          } else {
            this.$alert(`该玩家身份：${targetPlayer.role}`, "查验结果", {
              confirmButtonText: "知道了",
              customClass: "msg-box",
              showClose: false,
            });
          }
        }
      } else if (key === "see_two_center") {
        // 底牌查看不需要输入内容，直接展示结果弹窗
        const list = this.centerRoleList;
        let tipText = "";
        if (list.length === 0) {
          tipText = "本局没有剩余底牌";
        } else if (list.length === 1) {
          tipText = `剩余底牌：${list[0]}`;
        } else {
          tipText = `两张底牌分别为：${list[0]}、${list[1]}`;
        }
        this.$alert(tipText, "底牌查验结果", {
          confirmButtonText: "知道了",
          customClass: "msg-box",
          showClose: false,
        });
      }

      // 输入不合法，不关闭弹窗、不消耗技能
      if (!isValid) return;

      // 校验通过，传递当前技能key给父组件记录到usedSkillKeys
      this.$emit("confirm-skill", this.currentSkillKey);
      this.handleClose();
    },
  },
};
</script>

<style scoped>
.center-role-box {
  display: flex;
  gap: 12px;
}
.role-item {
  padding: 8px 16px;
  background: #e6f4ff;
  border-radius: 6px;
  font-size: 16px;
}
</style>