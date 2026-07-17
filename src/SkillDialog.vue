<!--
 * @Author: YangRui
 * @Date: 2026-06-28 22:24:08
 * @LastEditors: YangRui
 * @LastEditTime: 2026-07-17 23:54:35
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
    <!-- 互斥身份：先选择要使用的技能，只展示未使用过的技能 -->
    <div v-if="needSelectSkill">
      <p style="margin-bottom: 16px">
        <span v-if="currentRoleInfo.singleSkill">
          该身份技能互斥，本局仅可使用其中一项，请选择要发动的技能
        </span>
        <span v-else> 该身份有多个技能，请选择要发动的技能 </span>
      </p>
      <el-radio-group v-model="selectSkillKey">
        <el-radio
          v-for="sk in totalSkillKeys"
          :key="sk"
          :label="sk"
          :disabled="usedSkillKeys.includes(sk)"
        >
          {{ ONE_NIGHT_SKILL_MAP[sk]?.label }}
          <span v-if="usedSkillKeys.includes(sk)">(已发动)</span>
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
        <div v-for="role in centerRoleList" :key="role" class="role-item">
          ？
        </div>
      </div>
      <div v-else>暂无剩余底牌</div>
    </div>

    <!-- 互换身份 rob_swap_player -->
    <div v-else-if="currentSkillKey === 'rob_swap_player'">
      <p style="margin-bottom: 12px">请输入你要互换身份的玩家序号</p>
      <el-input
        v-model="checkSeq"
        placeholder="输入数字序号"
        type="number"
      ></el-input>
    </div>

    <!-- 观看自己现在的身份 check_self_final -->
    <div v-else-if="currentSkillKey === 'check_self_final'">
      <p style="margin-bottom: 12px">
        点击发动技能后，你可以查看自己当前的身份
      </p>
    </div>

    <!-- 交换两名场上玩家身份 swap_two_players -->
    <div v-else-if="currentSkillKey === 'swap_two_players'">
      <p style="margin-bottom: 12px">
        请选择两名需要交换身份的玩家（不可包含自己、上帝）
      </p>
      <div style="display: flex; gap: 12px; align-items: center">
        <el-select
          v-model.number="checkSeq"
          placeholder="玩家1"
          style="width: 220px"
          clearable
        >
          <el-option
            v-for="item in validSwapPlayerList"
            :key="item.seq"
            :label="`${item.seq}号 - ${item.name}`"
            :value="item.seq"
          ></el-option>
        </el-select>
        <span> ↔ </span>
        <el-select
          v-model.number="secondSeq"
          placeholder="玩家2"
          style="width: 220px"
          clearable
        >
          <el-option
            v-for="item in validSwapPlayerList"
            :key="item.seq"
            :label="`${item.seq}号 - ${item.name}`"
            :value="item.seq"
          ></el-option>
        </el-select>
      </div>
    </div>

    <!-- 酒鬼与一张底牌互换 drunk_swap_center -->
    <div v-else-if="currentSkillKey === 'drunk_swap_center'">
      <div style="margin-bottom: 12px">请选择要互换的底牌</div>

      <div
        v-if="centerRoleList.length === 0"
        style="margin-bottom: 12px; color: #999"
      >
        本局没有剩余底牌，无法互换
      </div>

      <div
        v-if="centerRoleList.length > 0"
        style="margin-bottom: 12px; color: #999"
      >
        剩余底牌数量：{{ centerRoleList.length }}
        张，互换后你不会得知置换后的身份
      </div>

      <div
        v-if="centerRoleList.length > 0"
        class="unknown-face-down-deck flex-start"
      >
        <div
          v-for="(role, index) in centerRoleList"
          :key="index"
          @click="selectedCenterIndex = index"
          class="card"
          :style="{
            borderColor: selectedCenterIndex === index ? '#409eff' : '#d9d9d9',
            color: selectedCenterIndex === index ? '#409eff' : '#d9d9d9',
            boxShadow:
              selectedCenterIndex === index
                ? '0 0 0 3px rgba(64, 158, 255, 0.2)'
                : 'none',
          }"
        >
          <i class="el-icon-question"></i>
        </div>
      </div>
    </div>

    <!-- 后续其他技能在这里扩展 -->
    <div v-else>
      <p>该技能暂无交互弹窗</p>
    </div>

    <div slot="footer" class="dialog-footer">
      <div class="flex-end" v-if="!needSelectSkill">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleConfirm">发动技能</el-button>
      </div>
      <div class="flex-end" v-if="needSelectSkill">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          :disabled="!selectSkillKey"
          @click="confirmSelectSkill"
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
      secondSeq: "",
      selectedCenterIndex: null,
      needSelectSkill: false,
      selectSkillKey: "",
      totalSkillKeys: [],
      currentSkillKey: "",
      currentRoleInfo: {},
    };
  },
  watch: {
    visible(val) {
      if (val) {
        // 弹窗打开初始化所有临时状态
        this.checkSeq = "";
        this.secondSeq = "";
        this.selectedCenterIndex = null;
        this.needSelectSkill = false;
        this.selectSkillKey = "";
        this.totalSkillKeys = [];
        this.currentSkillKey = "";

        const playerRoleId = this.targetPlayer.roleId;
        const roleInfo = this.allRoleConfig.find(
          (item) => item.roleId === playerRoleId
        );
        if (!roleInfo) {
          this.currentSkillKey = this.skillKey;
          return;
        } else {
          this.currentRoleInfo = roleInfo;
        }
        // 身份有多技能，开启选择面板
        if (roleInfo.skills.length > 1) {
          this.needSelectSkill = true;
          this.totalSkillKeys = [...roleInfo.skills];
        } else {
          this.currentSkillKey = this.skillKey;
        }
      }
    },
  },
  computed: {
    /**
     * 可以两两交换的玩家列表
     */
    validSwapPlayerList() {
      // 过滤：排除自己、上帝、无序号旁观者
      return this.allPlayers.filter((p) => {
        if (!p.seq) return false;
        if (p.role === this.GOD_NAME) return false;
        if (p.uuid === this.targetPlayer.uuid) return false;
        return true;
      });
    },
    /**
     * 发动过的技能
     */
    usedSkillKeys() {
      return this.targetPlayer.usedSkillKeys || [];
    },
    /**
     * 未分配给玩家的剩余底牌
     */
    centerRoleList() {
      // 1. 生成本局完整身份池
      const fullRolePool = [];
      Object.entries(this.gameRoles).forEach(([roleName, maxCount]) => {
        for (let i = 0; i < maxCount; i++) {
          fullRolePool.push(roleName);
        }
      });

      // 2. 收集所有已分配给玩家的身份
      const usedRoleNames = this.allPlayers
        .filter((player) => player.role)
        .map((player) => player.role);

      // 3. 从总池移除已占用身份，得到剩余底牌
      usedRoleNames.forEach((role) => {
        const index = fullRolePool.indexOf(role);
        if (index > -1) fullRolePool.splice(index, 1);
      });

      return fullRolePool;
    },
  },
  methods: {
    // 关闭弹窗，重置所有临时状态
    handleClose() {
      this.checkSeq = "";
      this.secondSeq = "";
      this.selectedCenterIndex = null; // 新增
      this.needSelectSkill = false;
      this.selectSkillKey = "";
      this.totalSkillKeys = [];
      this.currentSkillKey = "";
      this.$emit("update:visible", false);
    },
    // 互斥身份：选中技能后切换到对应技能操作面板
    confirmSelectSkill() {
      this.currentSkillKey = this.selectSkillKey;
      this.needSelectSkill = false;
    },
    // 确认发动当前技能
    handleConfirm() {
      const activeSkill = this.currentSkillKey;
      let isValid = true;
      let targetSeq = null;
      let newPlayerList = null;

      if (activeSkill === "see_one_player") {
        targetSeq = Number(this.checkSeq);
        if (!targetSeq || targetSeq <= 0) {
          this.$message.warning("请输入合法玩家序号");
          isValid = false;
        } else {
          const targetPlayer = this.allPlayers.find((p) => p.seq === targetSeq);
          if (!targetPlayer) {
            this.$message.error("未找到该序号玩家");
            isValid = false;
          } else {
            this.$alert(
              `${this.checkSeq}号玩家身份：${targetPlayer.role}`,
              "查验结果",
              {
                confirmButtonText: "知道了",
                customClass: "msg-box",
                showClose: false,
              }
            );
          }
        }
      } else if (activeSkill === "see_two_center") {
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
      } else if (activeSkill === "rob_swap_player") {
        targetSeq = Number(this.checkSeq);
        if (!targetSeq || targetSeq <= 0) {
          this.$message.warning("请输入合法玩家序号");
          isValid = false;
        } else if (targetSeq === this.targetPlayer.seq) {
          this.$message.warning("不能选择自己互换身份");
          isValid = false;
        } else {
          const targetPlayer = this.allPlayers.find((p) => p.seq === targetSeq);
          if (!targetPlayer) {
            this.$message.error("未找到该序号玩家");
            isValid = false;
          } else {
            this.$alert(
              `${this.checkSeq}号身份：${targetPlayer.role}，确认后互换双方身份`,
              "互换预览",
              {
                confirmButtonText: "知道了",
                customClass: "msg-box",
                showClose: false,
              }
            );
            newPlayerList = JSON.parse(JSON.stringify(this.allPlayers));
            const self = newPlayerList.find(
              (item) => item.uuid === this.targetPlayer.uuid
            );
            const target = newPlayerList.find((item) => item.seq === targetSeq);
            if (self && target) {
              const tempRole = self.role;
              const tempRoleId = self.roleId;
              const tempSkills = self.skills;
              self.role = target.role;
              self.roleId = target.roleId;
              self.skills = target.skills;
              target.role = tempRole;
              target.roleId = tempRoleId;
              target.skills = tempSkills;
            }
          }
        }
      } else if (activeSkill === "swap_two_players") {
        const num1 = Number(this.checkSeq);
        const num2 = Number(this.secondSeq);
        // 基础数字校验
        if (!num1 || num1 <= 0 || !num2 || num2 <= 0) {
          this.$message.warning("请完整选择两名玩家");
          isValid = false;
        } else if (num1 === num2) {
          this.$message.warning("两名玩家不能是同一个人");
          isValid = false;
        } else if (
          num1 === this.targetPlayer.seq ||
          num2 === this.targetPlayer.seq
        ) {
          this.$message.warning("交换对象不能包含自己");
          isValid = false;
        } else {
          const p1 = this.allPlayers.find((p) => p.seq === num1);
          const p2 = this.allPlayers.find((p) => p.seq === num2);
          if (!p1 || !p2) {
            this.$message.error("选中的玩家不存在");
            isValid = false;
          } else {
            this.$alert(`玩家${num1}和玩家${num2}的身份已交换`, "交换成功", {
              confirmButtonText: "知道了",
              customClass: "msg-box",
              showClose: false,
            });
            newPlayerList = JSON.parse(JSON.stringify(this.allPlayers));
            const pl1 = newPlayerList.find((p) => p.seq === num1);
            const pl2 = newPlayerList.find((p) => p.seq === num2);
            if (pl1 && pl2) {
              const tempRole = pl1.role;
              const tempRoleId = pl1.roleId;
              const tempSkills = pl1.skills;
              pl1.role = pl2.role;
              pl1.roleId = pl2.roleId;
              pl1.skills = pl2.skills;
              pl2.role = tempRole;
              pl2.roleId = tempRoleId;
              pl2.skills = tempSkills;
            }
          }
        }
      } else if (activeSkill === "drunk_swap_center") {
        const centerList = this.centerRoleList;

        if (centerList.length === 0) {
          this.$message.warning("本局无剩余底牌，无法互换");
          isValid = false;
        } else if (this.selectedCenterIndex === null) {
          this.$message.warning("请先选择一张底牌");
          isValid = false;
        } else if (
          this.selectedCenterIndex < 0 ||
          this.selectedCenterIndex >= centerList.length
        ) {
          this.$message.warning("底牌选择无效");
          isValid = false;
        } else {
          newPlayerList = JSON.parse(JSON.stringify(this.allPlayers));
          const selfPlayer = newPlayerList.find(
            (item) => item.uuid === this.targetPlayer.uuid
          );
          const swapRole = centerList[this.selectedCenterIndex];

          // 只修改玩家身份，底牌由 centerRoleList 自动计算
          selfPlayer.role = swapRole;
          selfPlayer.roleId = "";
          selfPlayer.skills = [];

          this.$alert(
            "已与选中底牌完成互换，你不会得知置换后的身份",
            "操作完成",
            {
              confirmButtonText: "知道了",
              customClass: "msg-box",
              showClose: false,
            }
          );
        }
      } else if (activeSkill === "check_self_final") {
        const targetPlayer = this.allPlayers.find(
          (p) => p.uuid === this.targetPlayer.uuid
        );
        this.$alert(`你现在的身份是：${targetPlayer.role}`, "查验结果", {
          confirmButtonText: "知道了",
          customClass: "msg-box",
          showClose: false,
        });
      }

      if (!isValid) return;
      this.$emit("confirm-skill", {
        skillKey: activeSkill,
        targetSeq,
        newPlayerList,
      });
      this.handleClose();
    },
  },
};
</script>

<style scoped lang="scss">
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
.unknown-face-down-deck {
  flex-wrap: wrap;
  .card {
    margin-left: 12px;
    margin-bottom: 12px;
    width: 100px;
    height: 140px;
    border-radius: 12px;
    background: #e6f4ff;
    border: 2px solid #d9d9d9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: #8c8c8c;
    cursor: pointer;
    transition: all 0.2s;
  }
}
</style>