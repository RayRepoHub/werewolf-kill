<template>
  <el-dialog
    :title="`${GOD_NAME}之力`"
    :visible="visible"
    @close="handleClose"
    :fullscreen="true"
    :show-close="false"
    append-to-body
    :close-on-click-modal="false"
    class="god-power-dialog"
  >
    <!-- 一键清空身份 -->
    <div class="tool-bar">
      <el-button
        type="danger"
        size="mini"
        icon="el-icon-delete"
        @click="clearAllRoles"
      >
        一键清空所有玩家身份
      </el-button>
    </div>

    <!-- 玩家列表 - 响应式布局 -->
    <div class="player-list">
      <div v-for="(p, idx) in playerList" :key="idx" class="player-item">
        <!-- 玩家名 -->
        <div class="player-name" :title="p.name">
          {{ p.name }}
        </div>

        <!-- 序号 -->
        <el-input-number
          v-model="playerList[idx].seq"
          size="mini"
          placeholder="序号"
          class="seq-input"
        />

        <!-- 身份下拉 -->
        <el-select
          v-model="playerList[idx].role"
          size="mini"
          placeholder="选择身份"
          class="role-select"
        >
          <el-option label="无身份" value="" />
          <el-option
            v-for="(maxCnt, role) in gameRoles"
            :key="role"
            :label="`${role}（剩余：${getRemain(role, idx)}）`"
            :value="role"
            :disabled="getRemain(role, idx) <= 0"
          />
        </el-select>
      </div>
    </div>

    <template slot="footer">
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="save">
          保存修改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { GOD_NAME } from "@/const.js";

export default {
  name: "GodPower",
  props: {
    visible: { type: Boolean, default: false },
    players: { type: Array, default: () => [] },
    gameRoles: { type: Object, default: () => {} },
  },
  data() {
    return {
      loading: false,
      playerList: [],
      GOD_NAME: GOD_NAME,
    };
  },
  watch: {
    visible(val) {
      if (val) {
        const list = JSON.parse(JSON.stringify(this.players)).filter(
          (p) => p.role !== this.GOD_NAME
        );
        this.playerList = list;
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
    },

    clearAllRoles() {
      this.$confirm("确定要清空所有玩家的身份吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }).then(() => {
        this.playerList.forEach((p) => {
          p.role = "";
          p.seq = null;
        });
        this.$message.success("已清空所有玩家身份");
      });
    },

    getRemain(roleName, index) {
      let max = this.gameRoles[roleName] || 0;
      let used = 0;
      this.playerList.forEach((p, i) => {
        if (i === index) return;
        if (p.role === roleName) used++;
      });
      return max - used;
    },

    async save() {
      const seqs = this.playerList
        .filter((p) => p.seq && p.role)
        .map((p) => p.seq);
      if (new Set(seqs).size !== seqs.length) {
        this.$message.error("序号不能重复！");
        return;
      }

      const count = {};
      for (let p of this.playerList) {
        if (!p.role) continue;
        count[p.role] = (count[p.role] || 0) + 1;
      }

      for (let role in count) {
        const max = this.gameRoles[role] || 0;
        if (count[role] > max) {
          this.$message.error(`${role} 数量不能超过 ${max} 个`);
          return;
        }
      }

      this.loading = true;
      await this.$emit("save", this.playerList);
      this.loading = false;
      this.handleClose();
    },
  },
};
</script>

<style scoped>
/* 对话框最大宽度，避免电脑端太宽 */
:deep(.god-power-dialog) {
  max-width: 700px;
}

/* 顶部工具栏 */
.tool-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

/* 列表容器 */
.player-list {
  max-height: 60vh;
  overflow-y: auto;
}

/* 玩家行 - 自适应布局核心 */
.player-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap; /* 手机端自动换行 */
}

/* 玩家名 */
.player-name {
  flex: 0 0 100px;
  min-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 序号输入框 */
.seq-input {
  flex: 1;
  min-width: 120px;
}

/* 身份下拉框 */
.role-select {
  flex: 2;
  min-width: 140px;
}

/* 底部按钮居中 */
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>