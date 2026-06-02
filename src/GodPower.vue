<template>
  <el-dialog
    title="上帝之力"
    :visible="visible"
    @close="handleClose"
    width="700px"
    append-to-body
    :close-on-click-modal="false"
  >
    <!-- 一键清空身份 -->
    <div class="w-full flex-end" style="margin-bottom: 12px">
      <el-button
        type="danger"
        size="mini"
        icon="el-icon-delete"
        @click="clearAllRoles"
      >
        一键清空所有玩家身份
      </el-button>
    </div>

    <div
      v-for="(p, idx) in playerList"
      :key="idx"
      class="flex-between"
      style="margin-bottom: 12px"
    >
      <div class="text-ellipsis-single" style="width: 140px" :title="p.name">
        {{ p.name }}
      </div>

      <el-input-number
        v-model="playerList[idx].seq"
        size="mini"
        placeholder="序号"
        style="width: 200px"
      />

      <el-select
        v-model="playerList[idx].role"
        size="mini"
        placeholder="选择身份"
        style="width: 200px"
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

    <template slot="footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="save">
        保存修改
      </el-button>
    </template>
  </el-dialog>
</template>

<script>
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
    };
  },
  watch: {
    visible(val) {
      if (val) {
        // 只隐藏上帝，其他所有玩家（有无身份都显示）
        const list = JSON.parse(JSON.stringify(this.players)).filter(
          (p) => p.role !== "上帝"
        );
        this.playerList = list;
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
    },

    // 只清空玩家身份，不动上帝
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