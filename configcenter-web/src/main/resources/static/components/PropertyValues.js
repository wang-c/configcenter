// 配置value管理组件
const PropertyValuesTemplate = `
<div>
    <el-row style="margin-bottom: 10px">
        <el-col :span="12">
            <span style="font-size: large;color: #409EFF;">环境：</span>
            <el-select v-model="currentProfileId" @change="switchProfile" placeholder="请选择环境" size="medium">
                <el-option v-for="profile in allProfiles" :value="profile.profileId" :label="toShowingProfile(profile)" :key="profile.profileId">
                    <span v-for="i in profile.level">-</span>
                    <span>{{ toShowingProfile(profile) }}</span>
                </el-option>
            </el-select>
        </el-col>
        <el-col :span="12" style="text-align: right;">
            <router-link :to="'/configs/' + appId + '/' + currentProfileId + '/releases'">
                <el-button type="text">发布历史</el-button>
            </router-link>
        </el-col>
    </el-row>
    <div v-for="appProperty in appProperties" style="margin-bottom: 30px;">
        <el-row v-if="appProperty.app.appId === appId" style="margin-bottom: 10px">
            <el-col :span="6">
                <el-button type="primary" icon="el-icon-plus" size="small" @click="addPropertyValueDialogShowing = true" plain>新增</el-button>
            </el-col>
            <el-col :span="12" style="text-align: center;">
                <span style="font-size: x-large;color: #409EFF;">{{ toShowingApp(appProperty.app) }}</span>
            </el-col>
            <el-col :span="6" style="text-align: end">
                <el-popover placement="top" v-model="revertPopoverShowing" trigger="manual">
                    <p>所有修改都会被还原，确定还原？</p>
                    <div style="text-align: right; margin: 0">
                        <el-button type="text" size="mini" @click="revertPopoverShowing = false">取消</el-button>
                        <el-button type="primary" size="mini" @click="revertPropertyValues">确定</el-button>
                    </div>
                    <el-button slot="reference" icon="el-icon-close" size="small" :disabled="!edited" @click="revertPopoverShowing = true">还原修改</el-button>
                </el-popover>
                <el-button type="primary" icon="el-icon-upload" size="small" :disabled="!edited" @click="showAddReleaseDialog">发布修改</el-button>
            </el-col>
        </el-row>
        <el-row v-else style="margin-bottom: 10px">
            <el-col :offset="4" :span="16" style="text-align: center;">
                <span style="font-size: large;color: #67c23a;">{{ toShowingApp(appProperty.app) }}</span>
            </el-col>
        </el-row>

        <el-table v-for="profileProperty in appProperty.profileProperties"
                  :data="profileProperty.properties.length !== 0 ? profileProperty.properties : [{empty:true, propertiesSize:1, appId:appProperty.app.appId, profileId:profileProperty.profileId}]"
                  :span-method="profilePropertySpanMethod"
                  :cell-class-name="tableCellClassName"
                  :show-header="profileProperty.profileId === profileId"
                  :key="appProperty.app.appId + ':' + profileProperty.profileId"
                  :row-key="calcRowKey"
                  :default-sort="{prop: 'key'}"
                  :cell-style="{padding: '3px 0px'}"
                  border>
            <el-table-column label="环境" :resizable="false" width="150px">
                <template slot-scope="{ row }">
                    <span style="font-size: larger;color: #409EFF">{{ profileProperty.profileId }}</span>
                </template>
            </el-table-column>
            <el-table-column prop="key" label="配置key" :resizable="false">
                <template slot-scope="{ row }">
                    <div v-if="row.empty" style="text-align: center">
                        <span class="el-table__empty-text">暂无数据</span>
                    </div>
                    <template v-else>
                        <template v-if="appProperty.app.appId === appId && profileProperty.profileId === profileId">
                            <el-badge v-if="difference.addedKeys.indexOf(row.key) >= 0" type="success" value="新" class="badge-style">
                                <span class="badged-text-style propertyValue-text-style">{{ row.key }}</span>
                            </el-badge>
                            <el-badge v-else-if="difference.removedKeys.indexOf(row.key) >= 0" type="danger" value="删" class="badge-style">
                                <span class="badged-text-style propertyValue-text-style">{{ row.key }}</span>
                            </el-badge>
                            <span v-else class="propertyValue-text-style">{{ row.key }}</span>
                        </template>
                        <span v-else class="propertyValue-text-style">{{ row.key }}</span>
                    </template>
                </template>
            </el-table-column>
            <el-table-column prop="value" label="配置value" :resizable="false">
                <template slot-scope="{ row }">
                    <el-input v-if="row.editing" v-model="row.editingValue" type="textarea" autosize size="mini" clearable placeholder="请输入配置value"></el-input>
                    <template v-else>
                        <template v-if="appProperty.app.appId === appId && profileProperty.profileId === profileId && difference.modifiedValueKeys.indexOf(row.key) >= 0">
                            <el-badge type="warning" value="改" class="badge-style">
                                <el-tag v-if="row.value === null" size="medium">无效</el-tag>
                                <el-tag v-else-if="manager.type === 'NORMAL' && row.privilege === 'NONE'" type="danger" size="medium">无权限</el-tag>
                                <span v-else class="badged-text-style propertyValue-text-style">{{ row.value }}</span>
                            </el-badge>
                        </template>
                        <div v-else>
                            <el-tag v-if="row.value === null" size="medium">无效</el-tag>
                            <el-tag v-else-if="manager.type === 'NORMAL' && row.privilege === 'NONE'" type="danger" size="medium">无权限</el-tag>
                            <span v-else class="propertyValue-text-style">{{ row.value }}</span>
                        </div>
                    </template>
                </template>
            </el-table-column>
            <el-table-column prop="scope" label="作用域" :resizable="false" width="115px">
                <template slot-scope="{ row }">
                    <el-select v-if="row.editing" v-model="row.editingScope" size="mini" placeholder="请选择作用域" style="width: 90%">
                        <el-option value="PRIVATE" label="私有"></el-option>
                        <el-option value="PROTECTED" label="可继承"></el-option>
                        <el-option value="PUBLIC" label="公开"></el-option>
                    </el-select>
                    <template v-else>
                        <template v-if="appProperty.app.appId === appId && profileProperty.profileId === profileId && difference.modifiedScopeKeys.indexOf(row.key) >= 0">
                            <el-badge type="warning" value="改" class="badge-style">
                                <el-tag v-if="row.scope === 'PRIVATE'" size="medium">私有</el-tag>
                                <el-tag v-else-if="row.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                                <el-tag v-else-if="row.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                            </el-badge>
                        </template>
                        <div v-else>
                            <el-tag v-if="row.scope === 'PRIVATE'" size="medium">私有</el-tag>
                            <el-tag v-else-if="row.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                            <el-tag v-else-if="row.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                        </div>
                    </template>
                </template>
            </el-table-column>
            <el-table-column label="操作" header-align="center" align="center" :resizable="false" width="140px">
                <template slot-scope="{ row }">
                    <template v-if="appProperty.app.appId === appId && profileProperty.profileId === profileId">
                        <template v-if="difference.removedKeys.indexOf(row.key) >= 0">
                            <el-tooltip content="恢复" placement="top" :open-delay="1000" :hide-after="3000">
                                <el-button @click="addOrModifyPropertyValue(row.key, row.value, row.scope)" :disabled="manager.type === 'NORMAL' && row.privilege !== 'READ_WRITE'" type="success" icon="el-icon-plus" size="mini" circle></el-button>
                            </el-tooltip>
                        </template>
                        <template v-else-if="row.value === null || row.temporary">
                            <el-tooltip v-if="!row.editing" content="修改" placement="top" :open-delay="1000" :hide-after="3000">
                                <el-button @click="startEditing(row)" type="primary" :disabled="manager.type === 'NORMAL' && row.privilege !== 'READ_WRITE'" icon="el-icon-edit" size="mini" circle></el-button>
                            </el-tooltip>
                            <el-button-group v-else>
                                <el-tooltip content="取消修改" placement="top" :open-delay="1000" :hide-after="3000">
                                    <el-button @click="cancelEditing(row)" type="info" icon="el-icon-close" size="mini" circle></el-button>
                                </el-tooltip>
                                <el-tooltip content="确认修改" placement="top" :open-delay="1000" :hide-after="3000">
                                    <el-button @click="saveEditing(row)" type="success" icon="el-icon-check" size="mini" circle></el-button>
                                </el-tooltip>
                            </el-button-group>
                        </template>
                        <el-row v-else>
                            <el-col :span="12" style="text-align: center">
                                <el-tooltip v-if="!row.editing" content="修改" placement="top" :open-delay="1000" :hide-after="3000">
                                    <el-button @click="startEditing(row)" type="primary" :disabled="manager.type === 'NORMAL' && row.privilege !== 'READ_WRITE'" icon="el-icon-edit" size="mini" circle></el-button>
                                </el-tooltip>
                                <el-button-group v-else>
                                    <el-tooltip content="取消修改" placement="top" :open-delay="1000" :hide-after="3000">
                                        <el-button @click="cancelEditing(row)" type="info" icon="el-icon-close" size="mini" circle></el-button>
                                    </el-tooltip>
                                    <el-tooltip content="确认修改" placement="top" :open-delay="1000" :hide-after="3000">
                                        <el-button @click="saveEditing(row)" type="success" icon="el-icon-check" size="mini" circle></el-button>
                                    </el-tooltip>
                                </el-button-group>
                            </el-col>
                            <el-col :span="12" style="text-align: center">
                                <el-tooltip content="删除" placement="top" :open-delay="1000" :hide-after="3000">
                                    <el-button @click="deletePropertyValue(row)" type="danger" :disabled="manager.type === 'NORMAL' && row.privilege !== 'READ_WRITE'" icon="el-icon-delete" size="mini" circle></el-button>
                                </el-tooltip>
                            </el-col>
                        </el-row>
                    </template>
                    <template v-else-if="showOverrideButton(row)">
                        <el-tooltip content="覆盖" placement="top" :open-delay="1000" :hide-after="3000">
                            <el-button @click="overrideProperty(row)" :disabled="manager.type === 'NORMAL' && row.privilege !== 'READ_WRITE'" type="success" icon="el-icon-download" size="mini" plain circle></el-button>
                        </el-tooltip>
                    </template>
                </template>
            </el-table-column>
        </el-table>
    </div>
    <el-dialog :visible.sync="addPropertyValueDialogShowing" :before-close="closeAddPropertyValueDialog" title="新增配置项" width="50%">
        <el-form ref="addPropertyValueForm" :model="addPropertyValueForm" label-width="20%">
            <el-form-item label="配置key" prop="key" :rules="[{required:true, message:'请输入配置key', trigger:'blur'}]">
                <el-input v-model="addPropertyValueForm.key" clearable placeholder="请输入配置key" style="width: 90%"></el-input>
            </el-form-item>
            <el-form-item label="配置value" prop="value" :rules="[{required:true, message:'请输入配置value', trigger:'blur'}]">
                <el-input v-model="addPropertyValueForm.value" type="textarea" autosize clearable placeholder="请输入配置value" style="width: 90%"></el-input>
            </el-form-item>
            <el-form-item label="作用域" prop="scope" :rules="[{required:true, message:'请选择作用域', trigger:'blur'}]">
                <el-select v-model="addPropertyValueForm.scope" placeholder="请选择作用域" style="width: 90%">
                    <el-option value="PRIVATE" label="私有"></el-option>
                    <el-option value="PROTECTED" label="可继承"></el-option>
                    <el-option value="PUBLIC" label="公开"></el-option>
                </el-select>
            </el-form-item>
        </el-form>
        <div slot="footer">
            <el-button @click="closeAddPropertyValueDialog">取消</el-button>
            <el-button type="primary" @click="addPropertyValue">提交</el-button>
        </div>
    </el-dialog>
    <el-dialog :visible.sync="addReleaseDialogVisible" :before-close="closeAddReleaseDialog" title="新增发布" width="70%" center>
        <el-row>
            <el-col :span="3" style="text-align: right;">
                <span style="margin-right: 12px">变更的配置</span>
            </el-col>
            <el-col :span="21">
                <el-table :data="modifiedProperties"
                          :default-sort="{prop: 'key'}"
                          :cell-style="{padding: '5px 0px'}"
                          border>
                    <el-table-column prop="key" label="配置key">
                        <template slot-scope="{ row }">
                            <el-badge v-if="difference.addedKeys.indexOf(row.key) >= 0" type="success" value="新" class="badge-style">
                                <span class="badged-text-style propertyValue-text-style">{{ row.key }}</span>
                            </el-badge>
                            <el-badge v-else-if="difference.removedKeys.indexOf(row.key) >= 0" type="danger" value="删" class="badge-style">
                                <span class="badged-text-style propertyValue-text-style">{{ row.key }}</span>
                            </el-badge>
                            <span v-else class="propertyValue-text-style">{{ row.key }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column prop="value" label="配置value">
                        <template slot-scope="{ row }">
                            <template v-if="difference.modifiedValueKeys.indexOf(row.key) >= 0">
                                <el-badge type="warning" value="改" class="badge-style">
                                    <el-tag v-if="row.value === null">无效</el-tag>
                                    <el-tag v-else-if="manager.type === 'NORMAL' && row.privilege === 'NONE'" type="danger">无权限</el-tag>
                                    <span v-else class="badged-text-style propertyValue-text-style">{{ row.value }}</span>
                                </el-badge>
                            </template>
                            <div v-else>
                                <el-tag v-if="row.value === null">无效</el-tag>
                                <el-tag v-else-if="manager.type === 'NORMAL' && row.privilege === 'NONE'" type="danger">无权限</el-tag>
                                <span v-else class="propertyValue-text-style">{{ row.value }}</span>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column prop="scope" label="作用域" :resizable="false" width="120px">
                        <template slot-scope="{ row }">
                            <template v-if="difference.modifiedScopeKeys.indexOf(row.key) >= 0">
                                <el-badge type="warning" value="改" class="badge-style">
                                    <el-tag v-if="row.scope === 'PRIVATE'" size="medium">私有</el-tag>
                                    <el-tag v-else-if="row.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                                    <el-tag v-else-if="row.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                                </el-badge>
                            </template>
                            <div v-else>
                                <el-tag v-if="row.scope === 'PRIVATE'" size="medium">私有</el-tag>
                                <el-tag v-else-if="row.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                                <el-tag v-else-if="row.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                            </div>
                        </template>
                    </el-table-column>
                </el-table>
            </el-col>
        </el-row>
        <el-form ref="addReleaseForm" :model="addReleaseForm" label-width="12.5%">
            <el-form-item label="备注" prop="memo" :rules="[{required:false, message:'请输入备注', trigger:'blur'}]">
                <el-input v-model="addReleaseForm.memo" type="textarea" autosize clearable placeholder="请输入备注"></el-input>
            </el-form-item>
        </el-form>
        <div slot="footer">
            <el-button @click="closeAddReleaseDialog">取消</el-button>
            <el-button type="primary" @click="addRelease">提交</el-button>
        </div>
    </el-dialog>
</div>
`;

const PropertyValues = {
    template: PropertyValuesTemplate,
    props: ['appId', 'profileId'],
    data: function () {
        return {
            currentProfileId: this.profileId,
            manager: CURRENT_MANAGER,
            allProfiles: [],
            selfPropertiesLoading: false,
            appProperties: [],
            propertyValues: [],
            difference: {
                addedKeys: [],
                modifiedValueKeys: [],
                modifiedScopeKeys: [],
                removedKeys: []
            },
            inheritedAppReleases: [],
            inheritedAppPropertyKeys: [],
            inheritedAppPrivileges: [],
            addPropertyValueDialogShowing: false,
            addPropertyValueForm: {
                key: null,
                value: null,
                scope: null
            },
            revertPopoverShowing: false,
            addReleaseDialogVisible: false,
            addReleaseForm: {
                memo: null
            }
        };
    },
    computed: {
        edited: function () {
            return this.difference.addedKeys.length > 0
                || this.difference.modifiedValueKeys.length > 0
                || this.difference.modifiedScopeKeys.length > 0
                || this.difference.removedKeys.length > 0;
        },
        keyValidityMap: function () {
            let appMap = {};
            for (let i = 0; i < this.appProperties.length; i++) {
                let appProperty = this.appProperties[i];
                let profileMap = {};
                for (let j = 0; j < appProperty.profileProperties.length; j++) {
                    let profileProperty = appProperty.profileProperties[j];
                    let keymap = {};
                    for (let k = 0; k < profileProperty.properties.length; k++) {
                        let property = profileProperty.properties[k];
                        keymap[property.key] = this.calcKeyValidity(property.appId, property.profileId, property.key);
                    }
                    profileMap[profileProperty.profileId] = keymap;
                }
                appMap[appProperty.app.appId] = profileMap;
            }
            return appMap;
        },
        modifiedProperties: function () {
            const theThis = this;

            let properties = [];
            this.propertyValues.forEach(function (propertyValue) {
                if (theThis.difference.addedKeys.indexOf(propertyValue.key) >= 0
                    || theThis.difference.modifiedValueKeys.indexOf(propertyValue.key) >= 0
                    || theThis.difference.modifiedScopeKeys.indexOf(propertyValue.key) >= 0) {
                    properties.push({
                        key: propertyValue.key,
                        value: propertyValue.value,
                        scope: propertyValue.scope,
                        privilege: theThis.calcPrivilege(theThis.appId, propertyValue.key)
                    });
                }
            });

            this.inheritedAppReleases.forEach(function (appRelease) {
                if (appRelease.app.appId !== theThis.appId) {
                    return;
                }
                appRelease.inheritedProfileReleases.forEach(function (release) {
                    if (release.profileId !== theThis.profileId) {
                        return;
                    }
                    release.properties.forEach(function (property) {
                        if (theThis.difference.removedKeys.indexOf(property.key) >= 0) {
                            properties.push({
                                key: property.key,
                                value: property.value,
                                scope: property.scope,
                                privilege: theThis.calcPrivilege(theThis.appId, property.key)
                            });
                        }
                    });
                });
            });

            return properties;
        }
    },
    watch: {
        '$route': function () {
            this.refreshData();
        },
        propertyValues: function () {
            this.refreshAppProperties();
        },
        difference: function () {
            this.refreshAppProperties();
        },
        inheritedAppReleases: function () {
            this.refreshAppProperties();
        },
        inheritedAppPropertyKeys: function () {
            this.refreshAppProperties();
        },
        inheritedAppPrivileges: function () {
            this.refreshAppProperties();
        }
    },
    created: function () {
        this.refreshData();
    },
    methods: {
        refreshData: function () {
            this.findAllProfiles();
            this.findPropertyValues();
            this.comparePropertyValuesWithRelease();
            this.findInheritedAppReleases();
            this.findInheritedAppPropertyKeys();
            this.findInheritedAppPrivileges();
        },
        refreshAppProperties: function () {
            const theThis = this;

            let appProperties = [];
            this.inheritedAppReleases.forEach(function (appRelease) {
                let appProperty = {
                    app: appRelease.app,
                    profileProperties: []
                };
                appRelease.inheritedProfileReleases.forEach(function (release) {
                    let profileProperty = {
                        profileId: release.profileId,
                        properties: []
                    };
                    if (release.appId === theThis.appId && release.profileId === theThis.profileId) {
                        theThis.propertyValues.forEach(function (propertyValue) {
                            profileProperty.properties.push({
                                appId: release.appId,
                                profileId: release.profileId,
                                key: propertyValue.key,
                                value: propertyValue.value,
                                scope: propertyValue.scope,
                                privilege: theThis.calcPrivilege(release.appId, propertyValue.key),
                                editing: false,
                                editingValue: null,
                                editingScope: null
                            });
                        });
                        theThis.difference.removedKeys.forEach(function (key) {
                            let property;
                            for (let i = 0; i < release.properties.length; i++) {
                                if (release.properties[i].key === key) {
                                    property = release.properties[i];
                                    break;
                                }
                            }
                            if (property) {
                                let existing = false;
                                for (let i = 0; i < profileProperty.properties.length; i++) {
                                    let temp = profileProperty.properties[i];
                                    if (temp.key === property.key) {
                                        existing = true;
                                        break;
                                    }
                                }
                                if (!existing) {
                                    profileProperty.properties.push({
                                        appId: release.appId,
                                        profileId: release.profileId,
                                        key: property.key,
                                        value: property.value,
                                        scope: property.scope,
                                        privilege: theThis.calcPrivilege(release.appId, property.key),
                                        editing: false,
                                        editingValue: null,
                                        editingScope: null
                                    });
                                }
                            }
                        });
                    } else {
                        release.properties.forEach(function (property) {
                            profileProperty.properties.push({
                                appId: release.appId,
                                profileId: release.profileId,
                                key: property.key,
                                value: property.value,
                                scope: property.scope,
                                privilege: theThis.calcPrivilege(release.appId, property.key),
                                editing: false,
                                editingValue: null,
                                editingScope: null
                            });
                        });
                    }
                    appProperty.profileProperties.push(profileProperty);
                });
                theThis.fillCurrentProfileProperties(appProperty);
                appProperty.profileProperties.forEach(function (profileProperty) {
                    profileProperty.properties.forEach(function (property) {
                        property.propertiesSize = profileProperty.properties.length;
                    });
                });

                appProperties.push(appProperty);
            });

            this.appProperties = appProperties;
        },
        findAllProfiles: function () {
            const theThis = this;
            axios.get('../manage/profile/findProfileTree', {
                params: {
                    profileId: null
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                let extractProfiles = function (profileTree, level) {
                    let profiles = [];
                    if (profileTree.profile !== null) {
                        profileTree.profile.level = level;
                        profiles.push(profileTree.profile);
                    }
                    profileTree.children.forEach(function (child) {
                        profiles = profiles.concat(extractProfiles(child, level + 1));
                    });
                    return profiles;
                };
                theThis.allProfiles = extractProfiles(result.profileTree, -1);
            });
        },
        switchProfile: function (profileId) {
            this.$router.replace('/configs/' + this.appId + '/' + profileId);
        },
        findPropertyValues: function () {
            const theThis = this;
            axios.get('../manage/propertyValue/findAppProfilePropertyValues', {
                params: {
                    appId: this.appId,
                    profileId: this.profileId,
                    minScope: 'PRIVATE'
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.propertyValues = result.propertyValues;
            });
        },
        comparePropertyValuesWithRelease: function () {
            const theThis = this;
            this.doFindCurrentRelease(this.appId, this.profileId, function (release) {
                axios.get('../manage/propertyValue/comparePropertyValuesWithRelease', {
                    params: {
                        appId: theThis.appId,
                        profileId: theThis.profileId,
                        releaseVersion: release.version
                    }
                }).then(function (result) {
                    if (!result.success) {
                        Vue.prototype.$message.error(result.message);
                        return;
                    }
                    theThis.difference = result.difference;
                });
            });
        },
        findInheritedAppReleases: function () {
            const theThis = this;
            this.selfPropertiesLoading = true;
            axios.get('../manage/release/findInheritedReleases', {
                params: {
                    appId: this.appId,
                    profileId: this.profileId
                }
            }).then(function (result) {
                theThis.selfPropertiesLoading = false;
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.inheritedAppReleases = result.inheritedAppReleases;
            });
        },
        findInheritedAppPropertyKeys: function () {
            const theThis = this;
            axios.get('../manage/propertyKey/findInheritedPropertyKeys', {
                params: {
                    appId: this.appId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.inheritedAppPropertyKeys = result.appPropertyKeys;
            });
        },
        fillCurrentProfileProperties: function (appProperty) {
            const theThis = this;

            let propertyKeyMap = {};
            this.inheritedAppPropertyKeys.forEach(function (appPropertyKey) {
                if (appPropertyKey.app.appId === appProperty.app.appId) {
                    appPropertyKey.propertyKeys.forEach(function (propertyKey) {
                        propertyKeyMap[propertyKey.key] = propertyKey;
                    });
                }
            });
            appProperty.profileProperties.forEach(function (profileProperty) {
                profileProperty.properties.forEach(function (property) {
                    delete propertyKeyMap[property.key];
                });
            });
            appProperty.profileProperties.forEach(function (profileProperty) {
                if (profileProperty.profileId === theThis.profileId) {
                    for (let key in propertyKeyMap) {
                        let propertyKey = propertyKeyMap[key];
                        profileProperty.properties.push({
                            appId: appProperty.app.appId,
                            profileId: profileProperty.profileId,
                            key: propertyKey.key,
                            value: null,
                            scope: propertyKey.scope,
                            privilege: theThis.calcPrivilege(propertyKey.appId, propertyKey.key),
                            editing: false,
                            editingValue: null
                        });
                    }
                }
            });
        },
        findInheritedAppPrivileges: function () {
            const theThis = this;
            axios.get('../manage/propertyKey/findInheritedPrivileges', {
                params: {
                    appId: this.appId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.inheritedAppPrivileges = result.appPrivileges;
            });
        },
        calcPrivilege: function (appId, key) {
            let started = false;
            for (let i = 0; i < this.inheritedAppPrivileges.length; i++) {
                let appPrivilege = this.inheritedAppPrivileges[i];
                if (appPrivilege.app.appId === appId) {
                    started = true;
                }
                if (started) {
                    let privilege = appPrivilege.keyPrivileges[key];
                    if (privilege) {
                        return privilege;
                    }
                }
            }
            return 'READ_WRITE';
        },
        doFindProfile: function (profileId, processProfile) {
            axios.get('../manage/profile/findProfile', {
                params: {
                    profileId: profileId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                processProfile(result.profile);
            });
        },
        calcRowKey: function (row) {
            return row.key;
        },
        profilePropertySpanMethod: function ({row, column, rowIndex, columnIndex}) {
            if (columnIndex === 0) {
                if (rowIndex === 0) {
                    return [row.propertiesSize, 1];
                } else {
                    return [0, 0];
                }
            }
            if (row.empty) {
                if (columnIndex !== 1) {
                    return [0, 0];
                } else {
                    return [1, 4];
                }
            }
        },
        tableCellClassName: function ({row, column, rowIndex, columnIndex}) {
            if (columnIndex > 0 && (!this.isValidKey(row.appId, row.profileId, row.key) || row.value === null)) {
                return 'invalid-property';
            }
            return '';
        },
        showOverrideButton: function (row) {
            if (this.isValidKey(row.appId, row.profileId, row.key)) {
                return this.difference.removedKeys.indexOf(row.key) < 0;
            }
            return false;
        },
        isValidKey: function (appId, profileId, key) {
            let profileMap = this.keyValidityMap[appId];
            if (!profileMap) {
                return false;
            }
            let keyMap = profileMap[profileId];
            if (!keyMap) {
                return false;
            }
            return keyMap[key];
        },
        calcKeyValidity: function (appId, profileId, key) {
            const theThis = this;
            const removed = function (property) {
                return property.appId === theThis.appId && property.profileId === theThis.profileId && theThis.difference.removedKeys.indexOf(property.key) >= 0;
            };

            for (let i = 0; i < this.appProperties.length; i++) {
                let appProperty = this.appProperties[i];
                for (let j = 0; j < appProperty.profileProperties.length; j++) {
                    let profileProperty = appProperty.profileProperties[j];
                    for (let k = 0; k < profileProperty.properties.length; k++) {
                        let property = profileProperty.properties[k];
                        if (property.key === key) {
                            if (property.appId === appId && property.profileId === profileId) {
                                return !removed(property);
                            } else {
                                if (!removed(property)) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
            return true;
        },
        startEditing: function (property) {
            property.editing = true;
            property.editingValue = property.value;
            property.editingScope = property.scope;
        },
        cancelEditing: function (property) {
            property.editing = false;
            property.editingValue = null;
            property.editingScope = null;
            if (property.temporary) {
                const theThis = this;
                this.appProperties.forEach(function (appProperty) {
                    if (appProperty.app.appId !== theThis.appId) {
                        return;
                    }
                    appProperty.profileProperties.forEach(function (profileProperty) {
                        if (profileProperty.profileId !== theThis.profileId) {
                            return;
                        }
                        for (let i = 0; i < profileProperty.properties.length; i++) {
                            let temp = profileProperty.properties[i];
                            if (temp.key === property.key) {
                                profileProperty.properties.splice(i, 1);
                            }
                        }
                        profileProperty.properties.forEach(function (property) {
                            Vue.set(property, 'propertiesSize', profileProperty.properties.length);
                        });
                    });
                });
            }
        },
        saveEditing: function (property) {
            if (property.editingValue) {
                property.editingValue = property.editingValue.trim();
            }
            if (!property.editingValue) {
                Vue.prototype.$message.error('配置value不能为空');
                return;
            }
            this.addOrModifyPropertyValue(property.key, property.editingValue, property.editingScope);
        },
        addOrModifyPropertyValue: function (key, value, scope, callback) {
            const theThis = this;
            axios.get('../manage/propertyValue/addOrModifyPropertyValue', {
                params: {
                    appId: this.appId,
                    key: key,
                    profileId: this.profileId,
                    value: value,
                    scope: scope
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.refreshData();
                if (callback) {
                    callback();
                }
            });
        },
        deletePropertyValue: function (property) {
            const theThis = this;
            axios.get('../manage/propertyValue/deletePropertyValue', {
                params: {
                    appId: this.appId,
                    key: property.key,
                    profileId: this.profileId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.refreshData();
            });
        },
        overrideProperty: function (property) {
            const theThis = this;

            this.appProperties.forEach(function (appProperty) {
                if (appProperty.app.appId !== theThis.appId) {
                    return;
                }
                appProperty.profileProperties.forEach(function (profileProperty) {
                    if (profileProperty.profileId !== theThis.profileId) {
                        return;
                    }
                    for (let temp in profileProperty.properties) {
                        if (temp.key === property.key) {
                            return;
                        }
                    }

                    let temp = {
                        appId: theThis.appId,
                        profileId: theThis.profileId,
                        key: property.key,
                        value: property.value,
                        scope: property.scope,
                        privilege: theThis.calcPrivilege(appProperty.app.appId, property.key),
                        editing: false,
                        editingValue: null,
                        editingScope: null,
                        temporary: true
                    };
                    profileProperty.properties.push(temp);
                    profileProperty.properties.forEach(function (property) {
                        Vue.set(property, 'propertiesSize', profileProperty.properties.length);
                    });
                    theThis.startEditing(temp);
                });
            });
        },
        revertPropertyValues: function () {
            const theThis = this;

            this.doFindCurrentRelease(this.appId, this.profileId, function (release) {
                axios.get('../manage/propertyValue/revertPropertyValues', {
                    params: {
                        appId: theThis.appId,
                        profileId: theThis.profileId,
                        releaseVersion: release.version
                    }
                }).then(function (revertPropertyValuesResult) {
                    if (!revertPropertyValuesResult.success) {
                        Vue.prototype.$message.error(revertPropertyValuesResult.message);
                        return;
                    }
                    theThis.revertPopoverShowing = false;
                    theThis.refreshData();
                });
            });
        },
        closeAddPropertyValueDialog: function () {
            this.addPropertyValueDialogShowing = false;
            this.$refs['addPropertyValueForm'].resetFields();
        },
        doFindCurrentRelease: function (appId, profileId, callback) {
            const theThis = this;

            axios.get('../manage/release/findCurrentRelease', {
                params: {
                    appId: appId,
                    profileId: profileId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                callback(result.release);
            });
        },
        addPropertyValue: function () {
            const theThis = this;
            this.$refs.addPropertyValueForm.validate(function (valid) {
                if (!valid) {
                    return;
                }
                theThis.addOrModifyPropertyValue(
                    theThis.addPropertyValueForm.key,
                    theThis.addPropertyValueForm.value,
                    theThis.addPropertyValueForm.scope,
                    function () {
                        theThis.closeAddPropertyValueDialog();
                    });
            });
        },
        showAddReleaseDialog: function () {
            let keys = this.haveNotPrivilegeModifiedPropertyKeys();
            if (keys.length > 0) {
                Vue.prototype.$message.error("有敏感配置" + keys + "被修改，无权进行发布");
                this.refreshData();
                return;
            }
            this.refreshData();
            this.addReleaseDialogVisible = true;
        },
        closeAddReleaseDialog: function () {
            this.addReleaseDialogVisible = false;
            this.$refs['addReleaseForm'].resetFields();
        },
        addRelease: function () {
            const theThis = this;
            axios.get('../manage/release/addRelease', {
                params: {
                    appId: this.appId,
                    profileId: this.profileId,
                    memo: this.addReleaseForm.memo
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                Vue.prototype.$message.success(result.message);
                theThis.closeAddReleaseDialog();
                theThis.refreshData();
            });
        },
        haveNotPrivilegeModifiedPropertyKeys: function () {
            if (this.manager.type !== 'NORMAL') {
                return [];
            }
            let keys = [];
            for (let i = 0; i < this.modifiedProperties.length; i++) {
                let property = this.modifiedProperties[i];
                let privilege = this.calcPrivilege(this.appId, property.key);
                if (privilege !== 'READ_WRITE') {
                    keys.push(property.key);
                }
            }
            return keys;
        },
        toShowingProfile: function (profile) {
            if (!profile) {
                return '';
            }
            let text = profile.profileId;
            if (profile.profileName) {
                text += '（' + profile.profileName + '）';
            }
            return text;
        },
        toShowingApp: function (app) {
            if (!app) {
                return '';
            }
            let text = app.appId;
            if (app.appName) {
                text += '（' + app.appName + '）';
            }
            return text;
        }
    }
};