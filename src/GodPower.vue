<template>
  <el-dialog
    :title="`${GOD_NAME}之力`"
    :visible="visible"
    @close="handleClose"
    :fullscreen="true"
    :show-close="false"
    append-to-body
    :close-on-click-modal="false"
    class="full-screen-dialog"
  >
    <el-header class="tool-bar flex-end" height="48px">
      <el-button type="warning" size="small" @click="selectAllPlayer">
        全选/反选
      </el-button>
      <el-dropdown @command="handleRandom" trigger="click">
        <el-button type="primary" size="small">
          随机分配 <i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="randomSeq" @click.native.stop>
            随机分配序号（仅勾选）
          </el-dropdown-item>
          <el-dropdown-item command="randomRole" @click.native.stop>
            随机分配身份（仅勾选）
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
      <!-- 替换为下拉：移除数据 -->
      <el-dropdown @command="handleRemoveAction" trigger="click">
        <el-button type="danger" size="small">
          移除数据 <i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="clearSeq" @click.native.stop
            >移除勾选玩家序号</el-dropdown-item
          >
          <el-dropdown-item command="clearRole" @click.native.stop
            >移除勾选玩家身份</el-dropdown-item
          >
          <el-dropdown-item command="removePlayerBatch" @click.native.stop
            >移除勾选玩家</el-dropdown-item
          >
        </el-dropdown-menu>
      </el-dropdown>
    </el-header>

    <!-- 自定义虚线添加虚拟玩家按钮 -->
    <div class="add-fake-box">
      <div class="custom-dash-btn" @click="addFakePlayer">
        <i class="el-icon-plus"></i> 添加虚拟玩家
      </div>
    </div>

    <!-- 绑定ref用于滚动 -->
    <el-main
      ref="playerScrollWrap"
      style="padding: 0; height: calc(100% - 100px)"
    >
      <div v-for="(p, idx) in playerList" :key="idx" class="player-item">
        <!-- 新增复选框 -->
        <el-checkbox v-model="p.checked" size="mini"></el-checkbox>
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
    </el-main>

    <template slot="footer">
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="save">
        保存修改
      </el-button>
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
        // 初始化新增勾选字段，默认不勾选
        const list = JSON.parse(JSON.stringify(this.players))
          .filter((p) => p.role !== this.GOD_NAME)
          .map((item) => ({
            ...item,
            checked: false,
          }));
        this.playerList = list;
      }
    },
  },
  methods: {
    handleClose() {
      this.$emit("update:visible", false);
    },

    // 新增方法：添加虚拟玩家，自动命名虚拟玩家1、2、3...
    addFakePlayer() {
      const fakeCount = this.playerList.filter((item) =>
        item.name.startsWith("虚拟玩家")
      ).length;
      const newItem = {
        uuid: String(Date.now()),
        name: `虚拟玩家${fakeCount + 1}`,
        role: "",
        seq: null,
        dead: false,
        thirdMark: "",
        checked: false,
      };
      this.playerList.push(newItem);

      // 新增：DOM更新后滚动容器到底部
      this.$nextTick(() => {
        const wrap = this.$refs.playerScrollWrap.$el;
        if (wrap) {
          wrap.scrollTop = wrap.scrollHeight;
        }
      });
    },

    // 全选/反选切换
    selectAllPlayer() {
      const allChecked = this.playerList.every((item) => item.checked);
      this.playerList.forEach((p) => (p.checked = !allChecked));
    },

    // 下拉菜单统一事件
    handleRandom(command) {
      const checkedPlayers = this.playerList.filter((p) => p.checked);
      if (checkedPlayers.length === 0) {
        this.$message.warning("请先勾选需要分配的玩家！");
        return;
      }
      if (command === "randomSeq") this.randomSeq(checkedPlayers);
      if (command === "randomRole") this.randomRole(checkedPlayers);
    },

    // 移除数据下拉统一处理
    handleRemoveAction(command) {
      const checkedPlayers = this.playerList.filter((p) => p.checked);
      if (checkedPlayers.length === 0) {
        this.$message.warning("请先勾选需要操作的玩家！");
        return;
      }
      if (command === "clearSeq") {
        checkedPlayers.forEach((p) => (p.seq = null));
        this.$message.success(`已清空${checkedPlayers.length}名勾选玩家序号`);
      } else if (command === "clearRole") {
        checkedPlayers.forEach((p) => (p.role = ""));
        this.$message.success(`已清空${checkedPlayers.length}名勾选玩家身份`);
      } else if (command === "removePlayerBatch") {
        this.$confirm(
          `确定要彻底移除${checkedPlayers.length}名勾选玩家吗？`,
          "提示",
          {
            confirmButtonText: "确定",
            cancelButtonText: "取消",
            type: "warning",
            showClose: false,
            customClass: "msg-box",
          }
        )
          .then(() => {
            this.playerList = this.playerList.filter((p) => !p.checked);
            this.$message.success("已移除勾选玩家");
          })
          .catch(() => {});
      }
    },

    // 随机分配序号：仅勾选玩家从1开始编号，未勾选全部清空序号
    randomSeq(checkedPlayers) {
      const allPlayers = this.playerList;
      const needCount = checkedPlayers.length;

      // 1. 未勾选玩家序号全部置空
      allPlayers.forEach((p) => {
        if (!p.checked) {
          p.seq = null;
        }
      });

      // 2. 生成 1 ~ needCount 连续数字并打乱
      const seqArr = Array.from({ length: needCount }, (_, i) => i + 1);
      const shuffledSeq = this.shuffle(seqArr);

      // 3. 分配给勾选玩家
      checkedPlayers.forEach((player, idx) => {
        player.seq = shuffledSeq[idx];
      });

      this.$message.success(
        `已清空未勾选玩家序号，为${needCount}名勾选玩家随机分配1起连续序号`
      );
    },

    // 【核心：严格按照你的规则重写身份分配逻辑】
    randomRole(checkedPlayers) {
      const checkNum = checkedPlayers.length;
      // 1. 分离未勾选玩家
      const unCheckedPlayers = this.playerList.filter((p) => !p.checked);

      // 2. 构建完整总身份池（按配置上限生成所有身份）
      let fullRolePool = [];
      for (const [role, max] of Object.entries(this.gameRoles)) {
        for (let i = 0; i < max; i++) {
          fullRolePool.push(role);
        }
      }

      // 3. 剔除未勾选玩家身上已占用的身份
      const unCheckedUsedRoles = [];
      unCheckedPlayers.forEach((p) => {
        if (p.role) unCheckedUsedRoles.push(p.role);
      });
      // 逐个移除未勾选占用的身份
      unCheckedUsedRoles.forEach((role) => {
        const delIndex = fullRolePool.indexOf(role);
        if (delIndex > -1) fullRolePool.splice(delIndex, 1);
      });

      // 4. 剩余可用身份池打乱，取出勾选人数对应数量
      const shuffledPool = this.shuffle(fullRolePool);
      const assignRoles = shuffledPool.slice(0, checkNum);
      // 再次打乱待分配列表，实现随机互换
      const finalAssign = this.shuffle(assignRoles);

      // 5. 赋值给勾选玩家，未勾选玩家身份完全不动
      checkedPlayers.forEach((player, idx) => {
        player.role = finalAssign[idx];
      });

      this.$message.success(`已为${checkNum}名勾选玩家随机分配身份`);
    },

    // 数组洗牌工具
    shuffle(arr) {
      const newArr = [...arr];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    },

    // 计算身份剩余可用数量（排除当前行自身）
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
      // 校验：只校验勾选玩家的序号、身份
      const checkedPlayers = this.playerList.filter((p) => p.checked);
      const seqs = checkedPlayers
        .filter((p) => p.seq && p.role)
        .map((p) => p.seq);
      if (new Set(seqs).size !== seqs.length) {
        this.$message.error("勾选玩家的序号不能重复！");
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
          this.$message.error(`${role} 总数量不能超过 ${max} 个`);
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
.tool-bar {
  gap: 8px;
  padding: 0;
}
/* 自定义虚线按钮容器 */
.add-fake-box {
  margin-bottom: 8px;
}
/* 自定义100%宽度虚线按钮 白底灰字 */
.custom-dash-btn {
  width: 100%;
  padding: 12px 0;
  text-align: center;
  border: 1px dashed #c0c4cc;
  background: #ffffff;
  color: #606266;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}
.custom-dash-btn:hover {
  border-color: #909399;
  background: #fafafa;
}
.custom-dash-btn i {
  margin-right: 6px;
}
.player-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.el-checkbox {
  flex: 0 0 40px;
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
</style>