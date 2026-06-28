<!--
 * @Author: YangRui
 * @Date: 2026-06-28 22:24:08
 * @LastEditors: YangRui
 * @LastEditTime: 2026-06-28 22:59:54
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
    <div v-if="skillKey === 'see_one_player'">
      <p style="margin-bottom: 12px">请输入你要查验的玩家序号</p>
      <el-input
        v-model="checkSeq"
        placeholder="输入数字序号"
        type="number"
      ></el-input>
    </div>
    <!-- 后续其他技能在这里扩展 -->
    <div v-else>
      <p>该技能暂无交互弹窗</p>
    </div>
    <div slot="footer" class="dialog-footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确认</el-button>
    </div>
  </el-dialog>
</template>

<script>
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
    // 所有玩家完整列表，用来查身份
    allPlayers: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      checkSeq: "",
    };
  },
  methods: {
    // 取消：仅关闭弹窗，不消耗技能次数
    handleClose() {
      this.checkSeq = "";
      this.$emit("update:visible", false);
    },
    handleConfirm() {
      const key = this.skillKey;
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
      }

      // 输入不合法，不关闭弹窗、不消耗技能
      if (!isValid) return;

      // 校验通过，通知父组件：技能已使用，锁定按钮
      this.$emit("confirm-skill");
      this.handleClose();
    },
  },
};
</script>