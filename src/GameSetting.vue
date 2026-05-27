<template>
  <el-container style="height: 100%">
    <el-header style="display: flex; justify-content: end; padding: 0">
      <el-button type="primary" @click="openDialog()" style="height: 40px">
        新增身份
      </el-button>
    </el-header>
    <el-main style="padding: 0; height: calc(100% - 40px)">
      <div v-for="(role, index) in roleList" :key="index" class="role-info">
        <div style="margin-bottom: 20px">
          <div>
            <b>{{ role.name }}</b>
            （{{ role.desc }}）
          </div>
        </div>
        <div style="display: flex; justify-content: space-between">
          <el-switch
            v-model="role.enabled"
            active-text="显示"
            inactive-text="隐藏"
          />
          <div style="display: flex">
            <el-button type="success" size="mini" @click="openDialog(index)">
              编辑
            </el-button>
            <el-button type="danger" size="mini" @click="delRole(index)">
              删除
            </el-button>
          </div>
        </div>
        <el-divider></el-divider>
      </div>
    </el-main>
    <!-- 新增 + 编辑 共用一个弹窗 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="editDialog"
      :modal-append-to-body="false"
      :fullscreen="true"
      append-to-body
    >
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="请输入身份名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            type="textarea"
            :rows="3"
            placeholder="请输入技能描述"
            v-model="editForm.desc"
          >
          </el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editDialog = false">取 消</el-button>
        <el-button type="primary" @click="saveItem">确 定</el-button>
      </div>
    </el-dialog>
  </el-container>
</template>

<script>
export default {
  props: ["initialRoles"],
  data() {
    return {
      roleList: [],
      editDialog: false,
      editIndex: -1, // -1 = 新增，>=0 = 编辑
      editForm: { name: "", desc: "", enabled: true },
    };
  },
  created() {
    this.roleList = JSON.parse(JSON.stringify(this.initialRoles));
  },
  methods: {
    // 统一打开弹窗（新增/编辑都走这里）
    openDialog(index = -1) {
      this.editIndex = index;
      if (index === -1) {
        // 新增：清空表单
        this.editForm = { name: "", desc: "", enabled: true };
      } else {
        // 编辑：赋值表单
        this.editForm = { ...this.roleList[index] };
      }
      this.editDialog = true;
    },

    // 统一保存（新增/编辑都走这里）
    saveItem() {
      if (!this.editForm.name.trim()) {
        this.$message.warning("请输入身份名称");
        return;
      }
      if (this.editIndex === -1) {
        // 新增
        this.roleList.push({ ...this.editForm });
      } else {
        // 编辑
        this.roleList[this.editIndex] = { ...this.editForm };
      }
      this.editDialog = false;
    },

    // 删除
    delRole(index) {
      this.roleList.splice(index, 1);
    },

    // 最终提交列表
    getFinalList() {
      return this.roleList;
    },
  },
  computed: {
    // 弹窗标题自动切换
    dialogTitle() {
      return this.editIndex === -1 ? "新增身份" : "编辑身份";
    },
  },
};
</script>
<style scoped>
.role-info {
}
</style>