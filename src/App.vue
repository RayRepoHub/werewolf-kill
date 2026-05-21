<template>
  <div class="werewolf-game-container">
    <h2 class="text-center mb-4">狼人杀对局平台</h2>

    <div v-if="!localPlayer.name" class="mb-4">
      <el-input
        v-model="tempName"
        placeholder="请输入你的名字"
        style="width: 300px"
      ></el-input>
      <el-button type="primary" @click="saveName" class="ml-2"
        >确认进入</el-button
      >
    </div>

    <div v-else-if="!gameStatus.joined" class="mb-4">
      <el-button type="success" @click="joinGame" :disabled="!gameStatus.exist"
        >加入已有对局</el-button
      >
      <el-button type="warning" @click="createGame" class="ml-2"
        >重新创建对局</el-button
      >
    </div>

    <div v-if="showCreatePanel" class="mb-4">
      <el-form label-width="150px">
        <el-form-item label="总人数">
          <el-input-number v-model="createForm.total" :min="6" :max="18" />
        </el-form-item>
        <el-form-item label="狼人">
          <el-input-number v-model="createForm.wolf" :min="1" />
        </el-form-item>
        <el-form-item label="平民">
          <el-input-number v-model="createForm.villager" :min="1" />
        </el-form-item>
        <el-form-item label="预言家"
          ><el-switch v-model="createForm.seer"
        /></el-form-item>
        <el-form-item label="女巫"
          ><el-switch v-model="createForm.witch"
        /></el-form-item>
        <el-form-item label="猎人"
          ><el-switch v-model="createForm.hunter"
        /></el-form-item>
        <el-form-item label="白痴"
          ><el-switch v-model="createForm.fool"
        /></el-form-item>
        <el-form-item label="管理员密码">
          <el-input
            v-model="createForm.pwd"
            show-password
            placeholder="请设置密码"
          />
        </el-form-item>
      </el-form>
      <el-button type="primary" @click="doCreateGame">创建对局</el-button>
    </div>

    <div v-else-if="gameStatus.joined">
      <el-button type="info" @click="refreshAll" class="mb-3"
        >刷新信息</el-button
      >
      <el-button type="danger" @click="endGame" v-if="isJudge" class="ml-2"
        >结束本局</el-button
      >

      <el-collapse v-model="activeCollapse">
        <el-collapse-item title="我的身份" name="1">
          <div v-if="isJudge" class="font-bold">法官</div>
          <div v-else class="font-bold">
            {{ localPlayer.seq }} - {{ localPlayer.role }}
          </div>
          <el-button
            v-if="!isJudge && !localPlayer.role"
            type="success"
            class="mt-2"
            @click="drawRole"
            >抽取身份牌</el-button
          >
        </el-collapse-item>

        <el-collapse-item title="成员列表" name="2">
          <div
            v-for="p in players"
            :key="p.seq || p.name"
            class="py-2 border-bottom"
          >
            <span :class="{ dead: p.dead }"
              >{{ p.seq || "等待" }} - {{ p.name }}</span
            >
            <span v-if="isJudge" class="ml-2 text-muted">{{
              p.role || "未抽牌"
            }}</span>
            <el-button
              v-if="isJudge && p.seq && !p.dead"
              type="text"
              class="text-red ml-2"
              @click="setDead(p.seq)"
              >标记死亡</el-button
            >
          </div>
        </el-collapse-item>

        <el-collapse-item title="消息" name="3">
          <div v-if="isJudge" class="mb-2">
            <el-input
              v-model="judgeMsg"
              type="textarea"
              rows="2"
              placeholder="法官公告"
            />
            <el-button type="primary" class="mt-2" @click="sendMsg"
              >发布</el-button
            >
          </div>
          <div class="p-2 bg-light rounded">
            {{ gameData.msg || "暂无公告" }}
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
/* eslint-disable vue/multi-word-component-names */
export default {
  name: "WerewolfGame",
  data() {
    return {
      tempName: "",
      localPlayer: {},
      activeCollapse: ["1", "2", "3"],
      showCreatePanel: false,
      createForm: {
        total: 12,
        wolf: 4,
        villager: 4,
        seer: true,
        witch: true,
        hunter: true,
        fool: true,
        pwd: "",
      },
      gameData: {},
      gameStatus: { exist: false, joined: false },
      players: [],
      isJudge: false,
      judgeMsg: "",
      BIN_ID: "6a0f0ecb6610dd3ae88104e3",
      API_KEY: "$2a$10$Z9GMvjcEgBICbobvUeAOp.m7Wg/8FiUiblHXiv7XfVrpxAMEwOz3W",
    };
  },
  mounted() {
    this.loadLocal();
    this.getGame();
  },
  methods: {
    async fetch(url, options = {}) {
      const headers = {
        "Content-Type": "application/json",
        "X-Master-Key": this.API_KEY,
      };
      const res = await fetch(`https://api.jsonbin.io/v3/b/${this.BIN_ID}`, {
        headers,
        ...options,
      });
      return await res.json();
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
      if (!this.tempName) return;
      this.localPlayer.name = this.tempName;
      this.saveLocal();
    },
    async getGame() {
      const res = await this.fetch();
      this.gameData = res.record || {};
      this.players = this.gameData.players || [];
      this.gameStatus.exist = !!this.gameData.judge;
      const me = this.players.find((i) => i.name === this.localPlayer.name);
      if (me) {
        this.gameStatus.joined = true;
        this.localPlayer = { ...this.localPlayer, ...me };
        this.saveLocal();
      }
      this.isJudge = this.gameData.judge === this.localPlayer.name;
    },
    async saveGame() {
      await this.fetch("", {
        method: "PUT",
        body: JSON.stringify(this.gameData),
      });
    },
    async joinGame() {
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
      const { total, wolf, villager, seer, witch, hunter, fool, pwd } =
        this.createForm;
      const god =
        (seer ? 1 : 0) + (witch ? 1 : 0) + (hunter ? 1 : 0) + (fool ? 1 : 0);
      if (wolf + villager + god !== total) return;
      this.gameData = {
        judge: this.localPlayer.name,
        judgePwd: pwd,
        total,
        wolf,
        villager,
        seer,
        witch,
        hunter,
        fool,
        players: [
          { name: this.localPlayer.name, role: "法官", seq: 0, dead: false },
        ],
        msg: "对局已创建",
      };
      await this.saveGame();
      this.showCreatePanel = false;
      this.gameStatus = { exist: true, joined: true };
      this.isJudge = true;
    },
    async drawRole() {
      const g = this.gameData;
      const roles = [];
      for (let i = 0; i < g.wolf; i++) roles.push("狼人");
      for (let i = 0; i < g.villager; i++) roles.push("平民");
      if (g.seer) roles.push("预言家");
      if (g.witch) roles.push("女巫");
      if (g.hunter) roles.push("猎人");
      if (g.fool) roles.push("白痴");

      const used = this.players.map((i) => i.seq).filter(Boolean);
      let seq = 1;
      while (used.includes(seq)) seq++;

      const role = roles.splice((Math.random() * roles.length) | 0, 1)[0];
      const me = this.players.find((i) => i.name === this.localPlayer.name);
      me.role = role;
      me.seq = seq;
      this.localPlayer = { ...this.localPlayer, ...me };
      this.saveLocal();
      await this.saveGame();
    },
    async setDead(seq) {
      const p = this.players.find((i) => i.seq === seq);
      if (p) p.dead = true;
      await this.saveGame();
    },
    async sendMsg() {
      this.gameData.msg = this.judgeMsg;
      await this.saveGame();
    },
    async endGame() {
      this.gameData = {};
      await this.saveGame();
      this.gameStatus = { exist: false, joined: false };
      this.localPlayer = {
        name: this.localPlayer.name,
        role: "",
        seq: 0,
        dead: false,
      };
      this.saveLocal();
    },
    refreshAll() {
      this.getGame();
    },
  },
};
</script>

<style scoped>
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
</style>