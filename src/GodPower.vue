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
    <!-- 工具栏 -->
    <div class="tool-bar">
      <!-- 随机分配下拉菜单（已修复手机端BUG） -->
      <el-dropdown @command="handleRandom" trigger="click">
        <el-button type="primary" size="mini">
          随机分配 <i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="randomSeq" @click.native.stop>
            随机分配序号
          </el-dropdown-item>
          <el-dropdown-item command="randomRole" @click.native.stop>
            随机分配身份
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>

      <!-- 一键清空身份 -->
      <el-button
        type="danger"
        size="mini"
        icon="el-icon-delete"
        @click="clearAllRoles"
      >
        清空数据
      </el-button>
    </div>

    <!-- 玩家列表 - 响应式布局 -->
    <div class="player-list">
      <div v-for="(p, idx) in playerList" :key="idx" class="player-item">
        <div class="player-name" :title="p.name">{{ p.name }}</div>
        <el-input-number
          v-model="playerList[idx].seq"
          size="mini"
          placeholder="序号"
          class="seq-input"
        />
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

    // 下拉菜单统一事件
    handleRandom(command) {
      if (command === "randomSeq") this.randomSeq();
      if (command === "randomRole") this.randomRole();
    },

    // 随机分配序号
    randomSeq() {
      const count = this.playerList.length;
      if (count === 0) return;

      let seqArr = Array.from({ length: count }, (_, i) => i + 1);
      seqArr = this.shuffle(seqArr);

      this.playerList.forEach((p, idx) => {
        p.seq = seqArr[idx];
      });
      this.$message.success("已随机分配所有序号");
    },

    // 随机分配身份
    randomRole() {
      let rolePool = [];
      for (const [role, max] of Object.entries(this.gameRoles)) {
        for (let i = 0; i < max; i++) {
          rolePool.push(role);
        }
      }

      rolePool = this.shuffle(rolePool);
      const len = Math.min(this.playerList.length, rolePool.length);

      this.playerList.forEach((p, idx) => {
        p.role = idx < len ? rolePool[idx] : "";
      });

      this.$message.success("已随机分配所有身份");
    },

    // 数组洗牌
    shuffle(arr) {
      const newArr = [...arr];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    },

    clearAllRoles() {
      this.$confirm("确定要清空所有玩家的序号和身份吗？", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.playerList.forEach((p) => {
            p.role = "";
            p.seq = null;
          });
          this.$message.success("已清空玩家序号和身份数据");
        })
        .catch(() => {
          // 取消操作，不做处理
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
:deep(.god-power-dialog) {
  max-width: 700px;
}
.tool-bar {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 12px;
}
.player-list {
  max-height: 60vh;
  overflow-y: auto;
}
.player-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.player-name {
  flex: 0 0 100px;
  min-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.seq-input {
  flex: 1;
  min-width: 120px;
}
.role-select {
  flex: 2;
  min-width: 140px;
}
.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
}
</style>