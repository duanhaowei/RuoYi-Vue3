<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryRef" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="产品名称" prop="pname">
        <el-input v-model="queryParams.pname" placeholder="请输入产品名称" clearable @keyup.enter="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
        <el-button icon="Refresh" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="Plus" @click="handleAdd"
          v-hasPermi="['qrcode:producttype:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate"
          v-hasPermi="['qrcode:producttype:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete"
          v-hasPermi="['qrcode:producttype:remove']">删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="warning" plain icon="Download" @click="handleExport"
          v-hasPermi="['qrcode:producttype:export']">导出</el-button>
      </el-col>
      <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="producttypeList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <!-- <el-table-column label="产品编号" align="center" prop="id" /> -->
      <el-table-column label="产品名称" align="center" prop="pname" />
      <el-table-column label="产品详细" align="center" prop="columnjson">
        <template #default="scope">
          <div style="display: flex; align-items: center">
            <template v-for="(ele, index) in JSON.parse(scope.row.columnjson)" :key="ele.k1">
              <!-- {{ ele.k1 }}: {{ ele.v }} -->
              {{ ele.v }}/
            </template>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="技术文档" align="center" prop="doc" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template #default="scope">
          <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)"
            v-hasPermi="['qrcode:producttype:edit']">修改</el-button>
          <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)"
            v-hasPermi="['qrcode:producttype:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize"
      @pagination="getList" />

    <!-- 添加或修改产品类别说明对话框 -->
    <el-dialog :title="title" v-model="open" width="500px" append-to-body>
      <el-form ref="producttypeRef" :model="form" :rules="rules" label-width="80px">
        <!-- <el-form-item label="产品详细" prop="columnjson">
          <el-input v-model="form.columnjson" type="textarea" placeholder="请输入内容" />
        </el-form-item> -->
        <el-form-item label="产品名称" prop="pname">
          <el-input v-model="form.pname" placeholder="请输入产品名称" />
        </el-form-item>
        <el-form-item label="技术文档" prop="doc">
          <div style="display: flex;">
            <el-input v-model="form.doc" placeholder="请输入技术文档" :disabled="true" :readonly="true" />
            <el-button type="info" plain icon="Upload" @click="handleImport"
              v-hasPermi="['system:user:import']">导入</el-button>
          </div>
        </el-form-item>
        <div class="flex gap-4" v-for="e in formRowDate" :key="e.k">
          <el-input v-model="e.k1" placeholder="新增字段" style="width: 80px;" />
          <el-input v-model="e.v" placeholder="新增字段值" style="flex:1" />
        </div>
      </el-form>
      <div style="text-align: right;">
        <!-- <el-button type="info" @click="showFormRowDate">showFormRowDate</el-button> -->
        <el-button type="info" @click="addRow">新增一行</el-button>
        <el-button type="danger" @click="delRow">删除一行</el-button>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
    <!-- 文档信息导入对话框 -->
    <el-dialog :title="upload.title" v-model="upload.open" width="400px" append-to-body>
      <el-upload ref="uploadRef" :limit="1" accept=".pdf" :headers="upload.headers"
        :action="upload.url + '?updateSupport=' + upload.updateSupport" :disabled="upload.isUploading"
        :on-progress="handleFileUploadProgress" :on-success="handleFileSuccess" :auto-upload="false" drag>
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <template #tip>
          <div class="el-upload__tip text-center">
            <!-- <div class="el-upload__tip">
              <el-checkbox v-model="upload.updateSupport" />
            </div> -->
            <span>仅允许导入pdf格式文件。</span>
          </div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitFileForm">确 定</el-button>
          <el-button @click="upload.open = false">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Producttype">
import { listProducttype, getProducttype, delProducttype, addProducttype, updateProducttype } from "@/api/qrcode/producttype";

const { proxy } = getCurrentInstance();

const producttypeList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");

const formRowDate = ref([]);

function addRow() {
  formRowDate.value.push({
    k1: "",
    v: ""
  })
}

function delRow() {
  formRowDate.value.pop();
}

const data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    pname: null
  },
  rules: {
    pname: [
      { required: true, message: "产品名称不能为空", trigger: "blur" }
    ]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询产品类别说明列表 */
function getList() {
  loading.value = true;
  listProducttype(queryParams.value).then(response => {
    producttypeList.value = response.rows;
    total.value = response.total;
    loading.value = false;
  });
}

// 取消按钮
function cancel() {
  open.value = false;
  reset();
}

// 表单重置
function reset() {
  form.value = {
    id: null,
    columnjson: null,
    doc: null,
    pname: null
  };
  formRowDate.value = [];
  proxy.resetForm("producttypeRef");
}

/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList();
}

/** 重置按钮操作 */
function resetQuery() {
  proxy.resetForm("queryRef");
  handleQuery();
}

// 多选框选中数据
function handleSelectionChange(selection) {
  ids.value = selection.map(item => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = "添加产品类别说明";
}

/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  const _id = row.id || ids.value
  getProducttype(_id).then(response => {
    form.value = response.data;
    formRowDate.value = JSON.parse(form.value.columnjson);
    open.value = true;
    title.value = "修改产品类别说明";
  });
}

/** 提交按钮 */
function submitForm() {
  proxy.$refs["producttypeRef"].validate(valid => {
    if (valid) {
      form.value.columnjson = JSON.stringify(formRowDate.value);
      if (form.value.id != null) {
        updateProducttype(form.value).then(response => {
          proxy.$modal.msgSuccess("修改成功");
          open.value = false;
          getList();
        });
      } else {
        addProducttype(form.value).then(response => {
          proxy.$modal.msgSuccess("新增成功");
          open.value = false;
          getList();
        });
      }
    }
  });
}

/** 删除按钮操作 */
function handleDelete(row) {
  const _ids = row.id || ids.value;
  proxy.$modal.confirm('是否确认删除产品类别说明编号为"' + _ids + '"的数据项？').then(function () {
    return delProducttype(_ids);
  }).then(() => {
    getList();
    proxy.$modal.msgSuccess("删除成功");
  }).catch(() => { });
}

/** 导出按钮操作 */
function handleExport() {
  proxy.download('qrcode/producttype/export', {
    ...queryParams.value
  }, `producttype_${new Date().getTime()}.xlsx`)
}

getList();

import { getToken } from "@/utils/auth";
const upload = reactive({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: "",
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: { Authorization: "Bearer " + getToken() },
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + "/qrcode/producttype/doc"
});

/** 导入按钮操作 */
function handleImport() {
  upload.title = "用户导入";
  upload.open = true;
};

/** 文件上传成功处理 */
const handleFileSuccess = (response, file, fileList) => {
  console.log(response, file, fileList)
  data.form.doc = response.docUrl
  upload.open = false;
  upload.isUploading = false;
  proxy.$refs["uploadRef"].handleRemove(file);
  proxy.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
  getList();
};
/** 提交上传文件 */
function submitFileForm() {
  proxy.$refs["uploadRef"].submit();
};
/**文件上传中处理 */
const handleFileUploadProgress = (event, file, fileList) => {
  upload.isUploading = true;
};


</script>
<style scoped lang="scss">
.flex {
  display: flex;
  align-items: center;
}

.gap-4 {
  gap: 4px;
  margin-bottom: 18px;
}
</style>