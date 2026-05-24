<template>
  <div style="padding: 20px">
    <h3 class="text-center mb-4">身份配置管理</h3>

    <div class="mb-4 d-flex gap-2 justify-content-center flex-wrap">
      <el-input
        v-model="newRole.name"
        placeholder="身份名称"
        style="width: 150px"
      />
      <el-input
        v-model="newRole.desc"
        placeholder="技能描述"
        style="width: 260px"
      />
      <el-button type="primary" @click="addRole">新增身份</el-button>
    </div>

    <div style="max-width: 700px; margin: 0 auto">
      <div
        v-for="(role, index) in roleList"
        :key="index"
        class="border p-3 mb-2 d-flex align-items-center justify-content-between"
      >
        <div>
          <div>
            <b>{{ role.name }}</b
            >（{{ role.desc }}）
          </div>
        </div>
        <div class="flex gap-2">
          <el-switch
            v-model="role.enabled"
            active-text="显示"
            inactive-text="隐藏"
          />
          <el-button type="success" size="mini" @click="editRole(index)"
            >编辑</el-button
          >
          <el-button type="danger" size="mini" @click="delRole(index)"
            >删除</el-button
          >
        </div>
      </div>
    </div>

    <el-dialog title="编辑身份" :visible.sync="editDialog" width="500px">
      <el-form label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.desc" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
export default {
  props: ["initialRoles"],
  data() {
    return {
      roleList: [],
      newRole: { name: "", desc: "", enabled: true },
      editDialog: false,
      editIndex: -1,
      editForm: {},
    };
  },
  created() {
    this.roleList = JSON.parse(JSON.stringify(this.initialRoles));
  },
  methods: {
    addRole() {
      if (!this.newRole.name) return this.$message.warning("请输入名称");
      this.roleList.push({ ...this.newRole });
      this.newRole = { name: "", desc: "", enabled: true };
    },
    editRole(index) {
      this.editIndex = index;
      this.editForm = { ...this.roleList[index] };
      this.editDialog = true;
    },
    saveEdit() {
      this.roleList[this.editIndex] = { ...this.editForm };
      this.editDialog = false;
    },
    delRole(index) {
      this.roleList.splice(index, 1);
    },
    getFinalList() {
      return this.roleList;
    },
  },
};
</script>