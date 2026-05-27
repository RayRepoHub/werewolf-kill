<template>
  <div class="werewolf-game-container" v-loading="refreshLoading">
    <h2 class="text-center mb-4">狼人杀对局平台</h2>

    <div
      v-if="(!localPlayer.name || editingName) && !gameStatus.joined"
      class="mb-4"
      style="
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
      "
    >
      <el-input
        v-model="tempName"
        placeholder="请输入你的名字"
        style="width: 300px"
      ></el-input>
      <el-button type="primary" @click="saveName">
        {{ editingName ? "保存" : "确认进入" }}
      </el-button>
      <el-button v-if="editingName" @click="cancelEditName"> 取消 </el-button>
    </div>

    <div
      v-else-if="localPlayer.name && !gameStatus.joined"
      style="text-align: center; margin-bottom: 16px"
    >
      <div style="font-size: 16px; margin-bottom: 10px">
        你好，<span style="color: #1890ff; font-weight: bold">{{
          localPlayer.name
        }}</span>
        <el-button
          type="text"
          icon="el-icon-edit"
          @click="editName"
          style="margin-left: 4px"
        >
        </el-button>
      </div>

      <div style="display: flex; justify-content: center; margin-top: 10px">
        <el-button type="success" @click="createGame"> 创建对局 </el-button>
        <el-button type="warning" @click="joinGame" style="margin-left: 10px">
          加入对局
        </el-button>
        <el-button type="info" @click="askGameSetting"> 身份管理 </el-button>
      </div>
    </div>

    <div v-if="showCreatePanel" class="mb-4" style="margin-top: 20px">
      <el-form label-width="100px">
        <div
          v-for="role in roleConfigList"
          v-show="role.enabled"
          :key="role.name"
          class="mb-3"
          style="margin-bottom: 20px"
        >
          <div
            style="
              width: 100%;
              height: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
            "
          >
            <el-checkbox v-model="createForm.roles[role.name].enabled">
              {{ role.name }}
            </el-checkbox>
            <el-input-number
              v-if="createForm.roles[role.name].enabled"
              v-model="createForm.roles[role.name].count"
              :min="1"
              class="ml-3"
              size="mini"
            />
          </div>
          <div style="font-size: 14px">（{{ role.desc || "暂无描述" }}）</div>
        </div>

        <el-form-item label="管理员密码" :required="true">
          <el-input
            v-model="createForm.pwd"
            show-password
            placeholder="请输入管理员密码"
          />
        </el-form-item>
      </el-form>
      <div style="width: 100%; display: flex; justify-content: end">
        <el-button
          type="primary"
          @click="doCreateGame"
          :loading="createLoading"
        >
          创建
        </el-button>
      </div>
    </div>

    <div v-else-if="gameStatus.joined">
      <el-button type="info" @click="refreshAll" class="mb-3">
        刷新信息
      </el-button>

      <!-- 👇 非上帝玩家显示退出按钮 -->
      <el-button
        type="warning"
        @click="quitGame"
        class="ml-2 mb-3"
        v-if="!isJudge"
        :loading="quitGameLoading"
      >
        退出对局
      </el-button>

      <el-button
        type="danger"
        @click="endGame"
        v-if="isJudge"
        class="ml-2"
        :loading="endLoading"
      >
        结束本局
      </el-button>

      <div v-if="gameData.locked" class="mb-3 p-2 bg-warning rounded">
        ⚠️ 身份已锁定，不可抽牌
      </div>

      <el-collapse v-model="activeCollapse" style="margin-top: 20px">
        <el-collapse-item name="1">
          <template slot="title">
            我的身份<i class="el-icon-s-custom" style="margin-left: 4px" />
          </template>
          <div v-if="isJudge" class="font-bold">上帝</div>
          <div class="font-bold" v-else-if="localPlayer.role">
            {{ localPlayer.seq }} - {{ localPlayer.role }}({{
              localPlayer.name
            }})
            <div
              style="
                font-size: 14px;
                color: #666;
                margin-top: 4px;
                font-weight: normal;
              "
            >
              {{ getRoleDesc(localPlayer.role) }}
            </div>
          </div>
          <el-button
            v-if="!isJudge && !localPlayer.role && !gameData.locked"
            type="success"
            class="mt-2"
            @click="drawRole"
          >
            抽取身份牌
          </el-button>
        </el-collapse-item>

        <el-collapse-item name="2">
          <template slot="title">
            成员列表<i class="el-icon-s-order" style="margin-left: 4px" />
          </template>
          <div
            v-for="p in players"
            :key="p.seq || p.name"
            class="py-2 border-bottom"
          >
            <span :class="{ dead: p.dead }">
              <template v-if="p.seq && p.role">
                {{ p.seq }} - {{ p.name }}
                <span v-if="p.dead" style="color: red; margin: 0 5px">
                  [死亡]
                </span>
              </template>
              <template v-else>
                {{ p.name }}
                <span v-if="p.dead" style="color: red; margin-left: 5px">
                  [死亡]
                </span>
              </template>
            </span>
            <span
              v-if="(p.role && isJudge) || p.role === '上帝'"
              class="ml-2 text-muted"
            >
              {{ `(${p.role})` }}
            </span>
            <span v-else-if="!p.role" class="ml-2 text-muted"> (旁观者) </span>

            <el-button
              v-if="isJudge && p.seq"
              type="text"
              :class="p.dead ? 'text-green' : 'text-red'"
              class="ml-2"
              @click="toggleDead(p.seq)"
              style="margin-left: 10px"
            >
              {{ p.dead ? "设为存活" : "标记死亡" }}
            </el-button>
          </div>
        </el-collapse-item>
        <el-collapse-item name="3">
          <template slot="title">
            游戏笔记<i class="el-icon-info" style="margin-left: 4px" />
          </template>
          <el-input
            v-model="localPlayer.note"
            type="textarea"
            rows="6"
            placeholder="请输入"
          />
        </el-collapse-item>

        <!-- ====================== 新增：投票信息面板 ====================== -->
        <el-collapse-item name="4">
          <template slot="title">
            投票信息<i class="el-icon-s-ticket" style="margin-left: 4px" />
          </template>

          <div v-if="!isJudge && localPlayer.role && localPlayer.seq">
            <el-input
              v-model.number="voteTarget"
              type="number"
              placeholder="输入你要投的玩家序号"
              style="width: 200px; margin-bottom: 10px"
            ></el-input>
            <div style="display: flex; gap: 10px">
              <el-button type="primary" @click="doVote">确认投票</el-button>
              <el-button type="info" @click="doAbandon">弃票</el-button>
            </div>
            <div style="margin-top: 10px">
              当前你的选择：{{ voteTarget ? voteTarget + "号" : "未投票" }}
            </div>
          </div>

          <div v-else-if="isJudge" style="line-height: 1.8">
            <div v-for="(voters, targetSeq) in voteStat" :key="targetSeq">
              {{ targetSeq }}号({{ voters.length }}票)：{{
                voters.join("号、")
              }}号
            </div>
            <div
              style="margin-top: 8px; font-weight: bold"
              v-if="
                abandonList &&
                abandonList instanceof Array &&
                abandonList.length > 0
              "
            >
              弃票：{{ abandonList.join("号、") }}号
            </div>
            <!-- 上帝专用：一键填充投票结果到广播 -->
            <el-button
              type="success"
              size="small"
              icon="el-icon-copy-document"
              @click="fillVoteToBroadcast"
              style="margin-top: 10px"
            >
              一键填充投票结果到广播
            </el-button>
          </div>

          <div v-else>请先抽取身份后再投票</div>
        </el-collapse-item>
        <!-- =================================================================== -->

        <el-collapse-item name="5">
          <template slot="title">
            上帝广播<i class="el-icon-message-solid" style="margin-left: 4px" />
          </template>
          <div v-if="isJudge" class="mb-2">
            <el-input
              v-model="judgeMsg"
              type="textarea"
              rows="2"
              placeholder="请输入"
              style="margin-bottom: 20px"
            />
            <el-button
              type="primary"
              class="mt-2"
              @click="sendMsg"
              :loading="sendMsgLoading"
            >
              发布
            </el-button>
            <!-- <el-button
              v-if="isJudge && !gameData.locked"
              type="warning"
              class="mt-2 ml-2"
              @click="lockRoles"
            >
              锁定身份（开局）
            </el-button> -->
          </div>
          <div class="p-2 bg-light rounded">
            {{ gameData.msg || "暂无内容" }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-dialog
      title="身份管理"
      :visible.sync="roleSettingVisible"
      :fullscreen="true"
      class="role-set-dialog"
    >
      <GameSetting ref="setting" :initial-roles="roleConfigList" />
      <span slot="footer" class="dialog-footer">
        <el-button @click="roleSettingVisible = false">取 消</el-button>
        <el-button
          type="primary"
          :loading="saveRoleLoading"
          @click="saveGameSetting"
        >
          保 存
        </el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import GameSetting from "@/GameSetting.vue";
import { ADMIN_PASSWORD } from "@/const.js";
/* eslint-disable vue/multi-word-component-names */
export default {
  name: "WerewolfGame",
  components: { GameSetting },
  data() {
    return {
      ADMIN_PASSWORD: ADMIN_PASSWORD,
      tempName: "",
      localPlayer: {},
      activeCollapse: ["1", "2", "3", "4", "5"],
      showCreatePanel: false,
      createLoading: false,
      endLoading: false,
      refreshLoading: false,
      editingName: false,
      originalName: "",

      roleConfigList: [],
      createForm: { roles: {}, pwd: "" },

      gameData: {},
      gameStatus: { exist: false, joined: false },
      players: [],
      isJudge: false,
      judgeMsg: "",
      BIN_ID: "6a0f0ecb6610dd3ae88104e3",
      API_KEY: "$2a$10$Z9GMvjcEgBICbobvUeAOp.m7Wg/8FiUiblHXiv7XfVrpxAMEwOz3W",
      roleSettingVisible: false,

      // 身份独立配置BIN 👇 把这里换成你新建的那个身份BIN ID
      settingBinId: "6a12952e6610dd3ae897b04a",
      saveRoleLoading: false,
      quitGameLoading: false,
      sendMsgLoading: false,

      // === 投票新增变量 ===
      voteTarget: null,
      voteStat: {},
      abandonList: [],
    };
  },
  mounted() {
    this.loadLocal();
    this.getRoleConfig();
    this.getGame();
  },
  methods: {
    // 上帝专用：一键把投票结果填充到广播框
    fillVoteToBroadcast() {
      let text = "今日投票结果：\n";

      // 拼接投票统计
      for (let target in this.voteStat) {
        const voters = this.voteStat[target];
        text += `${target}号(${voters.length}票)：${voters.join("号、")}号\n`;
      }

      // 拼接弃票
      if (this.abandonList.length > 0) {
        text += `弃票：${this.abandonList.join("号、")}号\n`;
      }

      // 填入广播输入框
      this.judgeMsg = text.trim();
      this.$message.success("已自动填充投票结果到广播输入框！");
    },

    // 读取身份配置（独立BIN）
    async getRoleConfig() {
      try {
        const res = await fetch(
          `https://api.jsonbin.io/v3/b/${this.settingBinId}`,
          {
            headers: { "X-Master-Key": this.API_KEY },
          }
        );
        const data = await res.json();
        this.roleConfigList = data.record || [];
        this.rebuildCreateForm();
      } catch (e) {
        console.log(e);
      }
    },

    // 保存身份配置（点确定才保存）
    async saveGameSetting() {
      this.saveRoleLoading = true;
      const final = this.$refs.setting.getFinalList();
      await fetch(`https://api.jsonbin.io/v3/b/${this.settingBinId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Master-Key": this.API_KEY,
        },
        body: JSON.stringify(final),
      });
      this.roleConfigList = final;
      this.rebuildCreateForm();
      this.saveRoleLoading = false;
      this.roleSettingVisible = false;
      this.$message.success("配置已保存");
    },

    // 重建创建对局表单（永远最新）
    rebuildCreateForm() {
      const roles = {};
      this.roleConfigList.forEach((r) => {
        roles[r.name] = { enabled: false, count: 1 };
      });
      this.createForm.roles = roles;
    },
    async checkAdminPassword() {
      try {
        const { value } = await this.$prompt("请输入管理员密码", "提示", {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          inputRequired: true,
          inputType: "password",
          closeOnClickModal: false,
          inputPattern: /\S/,
          inputErrorMessage: "密码不能为空",
        });

        const isOk = value === this.ADMIN_PASSWORD;
        if (isOk) {
          return true;
        } else {
          this.$message.error("密码错误");
          return false;
        }
      } catch {
        // 取消输入直接终止
        return false;
      }
    },
    async askGameSetting() {
      // const pass = await this.checkAdminPassword();
      // if (!pass) return;
      this.roleSettingVisible = true;
    },

    getRoleDesc(roleName) {
      const role = this.roleConfigList.find((item) => item.name === roleName);
      return role ? role.desc : "暂无描述";
    },

    editName() {
      this.originalName = this.localPlayer.name;
      this.tempName = this.localPlayer.name;
      this.editingName = true;
    },

    cancelEditName() {
      this.editingName = false;
      this.tempName = this.originalName;
    },

    async fetch(url, options = {}) {
      try {
        const headers = {
          "Content-Type": "application/json",
          "X-Master-Key": this.API_KEY,
        };
        const res = await fetch(`https://api.jsonbin.io/v3/b/${this.BIN_ID}`, {
          headers,
          ...options,
        });
        return await res.json();
      } catch (e) {
        console.log("请求异常");
        return { record: this.gameData || {} };
      }
    },
    loadLocal() {
      const p = localStorage.getItem("werewolf_player");
      this.localPlayer = p
        ? JSON.parse(p)
        : { name: "", role: "", seq: 0, dead: false };
    },
    saveLocal() {
      localStorage.setItem("werewolf_player", JSON.stringify(this.localPlayer));
    },
    saveName() {
      if (!this.tempName.trim()) return;
      this.localPlayer.name = this.tempName.trim();
      this.saveLocal();
      this.editingName = false;
      this.tempName = "";
    },
    async getGame() {
      this.refreshLoading = true;
      const res = await this.fetch();
      this.gameData = res.record || {};
      this.players = this.gameData.players || [];

      const beforeJoined = this.gameStatus.joined;
      this.gameStatus.exist = !!this.gameData.judge;

      if (beforeJoined && !this.gameStatus.exist) {
        this.gameStatus.joined = false;
        this.localPlayer = {
          name: this.localPlayer.name,
          role: "",
          seq: 0,
          dead: false,
          note: this.localPlayer.note || "",
        };
        this.saveLocal();
        this.$message.info("上帝已结束对局");
      }

      const me = this.players.find((i) => i.name === this.localPlayer.name);
      if (me) {
        this.gameStatus.joined = true;
        this.localPlayer = { ...this.localPlayer, ...me };
        this.saveLocal();
      } else {
        this.gameStatus.joined = false;
      }
      this.isJudge = this.gameData.judge === this.localPlayer.name;
      this.refreshLoading = false;

      // 新增：刷新投票统计
      this.refreshVoteStat();
    },
    async saveGame() {
      await this.fetch("", {
        method: "PUT",
        body: JSON.stringify(this.gameData),
      });
    },
    async joinGame() {
      await this.getGame();
      if (!this.gameStatus.exist) {
        this.$message.warning("当前暂无对局，请先创建对局");
        return;
      }
      if (this.players.some((i) => i.name === this.localPlayer.name)) {
        this.gameStatus.joined = true;
        return;
      }
      this.players.push({
        name: this.localPlayer.name,
        role: "",
        seq: 0,
        dead: false,
      });
      this.gameData.players = this.players;
      await this.saveGame();
      this.gameStatus.joined = true;
    },

    createGame() {
      this.showCreatePanel = true;
    },

    async doCreateGame() {
      const { roles, pwd } = this.createForm;
      if (!pwd || pwd.trim() === "") {
        this.$message.error("请输入管理员密码！");
        return;
      }
      if (pwd !== this.ADMIN_PASSWORD) {
        this.$message.error("密码错误！");
        return;
      }
      this.createLoading = true;
      const gameRoles = {};
      let total = 0;
      this.roleConfigList.forEach((item) => {
        const cfg = roles[item.name];
        if (cfg?.enabled) {
          gameRoles[item.name] = cfg.count;
          total += cfg.count;
        }
      });
      if (total < 3) {
        this.createLoading = false;
        this.$message.warning("至少3人");
        return;
      }
      this.gameData = {
        judge: this.localPlayer.name,
        judgePwd: pwd,
        roles: gameRoles,
        players: [
          { name: this.localPlayer.name, role: "上帝", seq: 0, dead: false },
        ],
        msg: "对局已创建",
        locked: false,
        votes: {},
        abandons: [],
      };
      await this.saveGame();
      this.createLoading = false;
      this.showCreatePanel = false;
      this.gameStatus = { exist: true, joined: true };
      this.isJudge = true;
      this.refreshAll();
    },

    async drawRole() {
      const g = this.gameData;
      if (g.locked) {
        this.$message.error("已锁定");
        return;
      }
      let fullDeck = [];
      Object.entries(g.roles).forEach(([name, cnt]) => {
        for (let i = 0; i < cnt; i++) fullDeck.push(name);
      });
      this.players.forEach((p) => {
        if (p.role && p.role !== "上帝") {
          const idx = fullDeck.indexOf(p.role);
          if (idx > -1) fullDeck.splice(idx, 1);
        }
      });
      if (fullDeck.length === 0) {
        this.$message.error("发完了");
        return;
      }
      const me = this.players.find((p) => p.name === this.localPlayer.name);
      const usedSeqs = this.players.map((p) => p.seq).filter(Boolean);
      let seq = 1;
      while (usedSeqs.includes(seq)) seq++;
      const rndIdx = Math.floor(Math.random() * fullDeck.length);
      me.role = fullDeck[rndIdx];
      me.seq = seq;
      this.localPlayer = { ...this.localPlayer, ...me };
      this.saveLocal();
      await this.saveGame();
      this.$message.success("抽牌成功");
    },

    async lockRoles() {
      this.gameData.locked = true;
      await this.saveGame();
      this.$message.success("已锁定");
    },

    async toggleDead(seq) {
      const p = this.players.find((i) => seq === i.seq);
      if (p) p.dead = !p.dead;
      await this.saveGame();
      this.$message.success("已切换");
    },

    async sendMsg() {
      this.sendMsgLoading = true;
      this.gameData.msg = this.judgeMsg;
      await this.saveGame();
      this.$message.success("发布成功");
      this.sendMsgLoading = false;
    },

    // ====================== 新增：退出对局函数 ======================
    async quitGame() {
      this.$confirm(
        "确定退出本局吗？退出后将从成员列表删除，无法自动返回",
        "提示",
        {
          confirmButtonText: "确定退出",
          cancelButtonText: "取消",
          type: "warning",
          center: true,
          showClose: false,
          closeOnClickModal: false,
        }
      )
        .then(async () => {
          const pass = await this.checkAdminPassword();
          if (!pass) return;
          this.quitGameLoading = true;
          // 👇 关键修复：必须同时更新 gameData.players
          this.players = this.players.filter(
            (p) => p.name !== this.localPlayer.name
          );

          // ✅ 必须把新数组赋值给 gameData，否则云端不更新！
          this.gameData.players = this.players;

          await this.saveGame(); // 保存到云端

          // 清空本地身份
          this.localPlayer.role = "";
          this.localPlayer.seq = 0;
          this.localPlayer.dead = false;
          this.saveLocal();

          this.gameStatus.joined = false;
          this.quitGameLoading = false;
          this.$message.success("已成功退出对局");
        })
        .catch(() => {});
    },
    // ==============================================================

    async endGame() {
      this.$confirm("结束本局后，其他所有成员也将自动退出, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
        center: true,
        showClose: false,
        closeOnClickModal: false,
      })
        .then(async () => {
          this.endLoading = true;
          this.gameData = {
            judge: "",
            judgePwd: "",
            roles: {},
            players: [],
            msg: "",
            locked: false,
            votes: {},
            abandons: [],
          };
          await this.saveGame();
          this.gameStatus = { exist: false, joined: false };
          this.localPlayer = {
            name: this.localPlayer.name,
            role: "",
            seq: 0,
            dead: false,
            note: this.localPlayer.note || "",
          };
          this.saveLocal();
          this.endLoading = false;
          this.$message.success("已成功结束本局");
          this.refreshAll();
        })
        .catch(() => {});
    },

    refreshAll() {
      this.getGame();
    },

    // ====================== 纯新增：投票功能（已修复0号BUG） ======================
    refreshVoteStat() {
      const votes = this.gameData.votes || {};
      const abandons = this.gameData.abandons || [];
      let stat = {};

      for (let voterSeq in votes) {
        // 过滤上帝0号，只统计有身份的玩家
        if (voterSeq == 0) continue;

        const target = votes[voterSeq];
        if (!stat[target]) stat[target] = [];
        stat[target].push(Number(voterSeq));
      }

      this.voteStat = stat;
      // 过滤弃票里的0号
      this.abandonList = abandons.filter((num) => num != 0).map(Number);
    },

    async doVote() {
      if (!this.voteTarget) {
        this.$message.warning("请输入投票序号");
        return;
      }
      await this.getGame();
      const seq = this.localPlayer.seq;
      // 上帝不能投票
      if (seq === 0) return;

      this.gameData.votes = this.gameData.votes || {};
      this.gameData.abandons = this.gameData.abandons || [];

      this.gameData.votes[seq] = this.voteTarget;

      const idx = this.gameData.abandons.indexOf(seq);
      if (idx >= 0) this.gameData.abandons.splice(idx, 1);

      await this.saveGame();
      this.refreshVoteStat();
      this.$message.success("投票成功：投给 " + this.voteTarget + " 号");
    },

    async doAbandon() {
      await this.getGame();
      const seq = this.localPlayer.seq;
      if (seq === 0) return;

      this.gameData.votes = this.gameData.votes || {};
      this.gameData.abandons = this.gameData.abandons || [];

      delete this.gameData.votes[seq];

      if (!this.gameData.abandons.includes(seq)) {
        this.gameData.abandons.push(seq);
      }

      this.voteTarget = null;
      await this.saveGame();
      this.refreshVoteStat();
      this.$message.info("你已弃票");
    },
    // ==============================================================
  },
};
</script>

<style scoped>
::v-deep .role-set-dialog .el-dialog.is-fullscreen {
  height: 100vh !important;
  display: flex;
  flex-direction: column;
}
::v-deep .role-set-dialog .el-dialog__body {
  height: calc(100% -200px);
  overflow-y: scroll;
  padding: 0 20px;
}
.werewolf-game-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.text-center {
  text-align: center;
}
.border-bottom {
  border-bottom: 1px solid #eee;
}
.dead {
  color: red;
  font-weight: bold;
}
.font-bold {
  font-size: 16px;
  font-weight: bold;
}
.text-red {
  color: red;
}
.text-green {
  color: green;
}
.bg-warning {
  background: #fff7e6;
  border: 1px solid #ffc107;
}
.rounded {
  border-radius: 4px;
  padding: 8px 12px;
}
</style>