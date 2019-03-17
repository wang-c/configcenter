// 发布历史管理组件
const ReleasesTemplate = `
<div>
    <el-container>
        <el-header height="30px" style="padding: 0">
            <span style="font-size: medium;color: #409EFF;">应用：</span><span style="font-size: medium;">{{ toShowingApp(app) }}</span>
            <span style="font-size: medium;color: #409EFF;margin-left: 20px">环境：</span><span style="font-size: medium;">{{ toShowingProfile(profile) }}</span>
        </el-header>
        <el-container>
            <el-aside width="500px">
                <el-table :data="releases"
                          @current-change="changeShowingRelease"
                          border
                          highlight-current-row
                          :row-class-name="currentReleaseClassName"
                          :cell-style="{padding: '7px 0'}">
                    <el-table-column property="version" label="版本" width="70px"></el-table-column>
                    <el-table-column property="releaseTime" label="发布时间" width="150px">
                        <template slot-scope="{ row }">
                            <span style="font-size: xx-small">{{ new Date(row.releaseTime).format('yyyy-MM-dd hh:mm:ss') }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column property="memo" label="备注">
                        <template slot-scope="{ row }">
                            <span style="font-size: xx-small">{{ row.memo }}</span>
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" header-align="center" width="55px">
                        <template slot-scope="{ row }">
                            <el-row>
                                <el-col :span="24" style="text-align: center">
                                    <el-tooltip content="回滚到此版本" placement="top" :open-delay="1000" :hide-after="3000">
                                        <el-button @click="revertRelease(row)" :disabled="currentRelease ? currentRelease.version === row.version : false" type="danger" icon="el-icon-arrow-left" size="mini" circle></el-button>
                                    </el-tooltip>
                                </el-col>
                            </el-row>
                        </template>
                    </el-table-column>
                </el-table>
                <el-row style="margin-top: 10px">
                    <el-col style="text-align: end">
                        <el-pagination :total="totalReleasesCount" :current-page.sync="queryReleasesForm.pageNo" :page-size.sync="queryReleasesForm.pageSize" @current-change="queryReleases" layout="total,prev,pager,next" small background></el-pagination>
                    </el-col>
                </el-row>
            </el-aside>
            <el-main style="padding: 0 0 0 2px">
                <el-tabs type="border-card" stretch>
                    <el-tab-pane label="变更的配置">
                        <el-table :data="showingRelease ? showingRelease.changes : []"
                                  :default-sort="{prop: 'key'}"
                                  border
                                  height="565"
                                  :header-cell-style="{padding: '8px 0'}"
                                  :cell-style="{padding: '2px 0'}">
                            <el-table-column type="expand">
                                <template slot-scope="props">
                                    <template v-if="showingRelease.difference.modifiedValueKeys.indexOf(props.row.key) >= 0 || showingRelease.difference.modifiedScopeKeys.indexOf(props.row.key) >= 0">
                                        <el-table :data="[props.row.previous]"
                                                  :show-header="false"
                                                  :row-style="{background: '#f6f9ff'}"
                                                  :cell-style="{padding: '8px 0'}">
                                            <el-table-column width="48px">
                                                <template slot-scope="{ row }">
                                                    <span style="font-size: small;color: #E6A23C">旧值</span>
                                                </template>
                                            </el-table-column>
                                            <el-table-column property="key" label="配置key">
                                                <template slot-scope="{ row }">
                                                    <span class="release-property-text-style">{{ row.key }}</span>
                                                </template>
                                            </el-table-column>
                                            <el-table-column property="value" label="配置value">
                                                <template slot-scope="{ row }">
                                                    <el-tag v-if="row.value === null" size="medium">无效</el-tag>
                                                    <el-tag v-else-if="manager.type === 'NORMAL' && row.privilege === 'NONE'" type="danger" size="medium">无权限</el-tag>
                                                    <span v-else class="release-property-text-style">{{ row.value }}</span>
                                                </template>
                                            </el-table-column>
                                            <el-table-column property="scope" label="作用域" width="94px">
                                                <template slot-scope="{ row }">
                                                    <el-tag v-if="row.scope === 'PRIVATE'" size="medium">私有</el-tag>
                                                    <el-tag v-else-if="row.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                                                    <el-tag v-else-if="row.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                                                </template>
                                            </el-table-column>
                                        </el-table>
                                    </template>
                                </template>
                            </el-table-column>
                            <el-table-column property="key" label="配置key">
                                <template slot-scope="{ row }">
                                    <el-badge v-if="showingRelease.difference.addedKeys.indexOf(row.key) >= 0" type="success" value="新" class="badge-style">
                                        <span class="badged-text-style release-property-text-style">{{ row.key }}</span>
                                    </el-badge>
                                    <el-badge v-else-if="showingRelease.difference.removedKeys.indexOf(row.key) >= 0" type="danger" value="删" class="badge-style">
                                        <span class="badged-text-style release-property-text-style">{{ row.key }}</span>
                                    </el-badge>
                                    <span v-else class="release-property-text-style">{{ row.key }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column label="配置value">
                                <template slot-scope="{ row }">
                                    <template v-if="showingRelease.difference.modifiedValueKeys.indexOf(row.key) >= 0">
                                        <el-badge type="warning" value="改" class="badge-style">
                                            <el-tag v-if="row.current.value === null" size="medium">无效</el-tag>
                                            <el-tag v-else-if="manager.type === 'NORMAL' && row.current.privilege === 'NONE'" type="danger" size="medium">无权限</el-tag>
                                            <span v-else class="badged-text-style release-property-text-style">{{ row.current.value }}</span>
                                        </el-badge>
                                    </template>
                                    <div v-else-if="row.current">
                                        <el-tag v-if="row.current.value === null" size="medium">无效</el-tag>
                                        <el-tag v-else-if="manager.type === 'NORMAL' && row.current.privilege === 'NONE'" type="danger" size="medium">无权限</el-tag>
                                        <span v-else class="release-property-text-style">{{ row.current.value }}</span>
                                    </div>
                                    <div v-else>
                                        <el-tag v-if="row.previous.value === null" size="medium">无效</el-tag>
                                        <el-tag v-else-if="manager.type === 'NORMAL' && row.previous.privilege === 'NONE'" type="danger" size="medium">无权限</el-tag>
                                        <span v-else class="release-property-text-style">{{ row.previous.value }}</span>
                                    </div>
                                </template>
                            </el-table-column>
                            <el-table-column label="作用域" :resizable="false" width="95px">
                                <template slot-scope="{ row }">
                                    <template v-if="showingRelease.difference.modifiedScopeKeys.indexOf(row.key) >= 0">
                                        <el-badge type="warning" value="改" class="badge-style">
                                            <el-tag v-if="row.current.scope === 'PRIVATE'" size="medium">私有</el-tag>
                                            <el-tag v-else-if="row.current.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                                            <el-tag v-else-if="row.current.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                                        </el-badge>
                                    </template>
                                    <div v-else-if="row.current">
                                        <el-tag v-if="row.current.scope === 'PRIVATE'" size="medium">私有</el-tag>
                                        <el-tag v-else-if="row.current.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                                        <el-tag v-else-if="row.current.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                                    </div>
                                    <div v-else>
                                        <el-tag v-if="row.previous.scope === 'PRIVATE'" size="medium">私有</el-tag>
                                        <el-tag v-else-if="row.previous.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                                        <el-tag v-else-if="row.previous.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                                    </div>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                    <el-tab-pane label="所有配置">
                        <el-table :data="showingRelease ? showingRelease.properties : []"
                                  :default-sort="{prop: 'key'}"
                                  border
                                  height="565"
                                  :header-cell-style="{padding: '8px 0'}"
                                  :cell-style="{padding: '2px 0'}">
                            <el-table-column property="key" label="配置key">
                                <template slot-scope="{ row }">
                                    <span class="release-property-text-style">{{ row.key }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column property="value" label="配置value">
                                <template slot-scope="{ row }">
                                    <el-tag v-if="row.value === null">无效</el-tag>
                                    <el-tag v-else-if="manager.type === 'NORMAL' && row.privilege === 'NONE'" type="danger">无权限</el-tag>
                                    <span v-else class="release-property-text-style">{{ row.value }}</span>
                                </template>
                            </el-table-column>
                            <el-table-column property="scope" label="作用域" :resizable="false" width="80px">
                                <template slot-scope="{ row }">
                                    <el-tag v-if="row.scope === 'PRIVATE'" size="medium">私有</el-tag>
                                    <el-tag v-else-if="row.scope === 'PROTECTED'" type="success" size="medium">可继承</el-tag>
                                    <el-tag v-else-if="row.scope === 'PUBLIC'" type="warning" size="medium">公开</el-tag>
                                </template>
                            </el-table-column>
                        </el-table>
                    </el-tab-pane>
                </el-tabs>
            </el-main>
        </el-container>
    </el-container>
</div>
`;

const Releases = {
    template: ReleasesTemplate,
    props: ['appId', 'profileId'],
    data: function () {
        return {
            manager: CURRENT_MANAGER,
            app: {},
            profile: {},
            queryReleasesForm: {
                pageNo: 1,
                pageSize: 10
            },
            totalReleasesCount: 0,
            releases: [],
            showingRelease: {},
            inheritedAppPrivileges: [],
            currentRelease: null
        };
    },
    created: function () {
        this.findApp(this.appId);
        this.findProfile(this.profileId);
        this.findInheritedAppPrivileges();
        this.queryReleases();
    },
    methods: {
        queryReleases: function () {
            const theThis = this;
            this.findCurrentRelease();
            this.doQueryReleases(
                this.queryReleasesForm.pageNo,
                this.queryReleasesForm.pageSize,
                this.appId,
                this.profileId,
                function (totalCount, releases) {
                    theThis.totalReleasesCount = totalCount;
                    releases.forEach(function (release) {
                        release.properties.forEach(function (property) {
                            property.privilege = theThis.calcPrivilege(release.appId, property.key);
                        });
                    });
                    for (let i = 0; i < releases.length - 1; i++) {
                        let current = releases[i];
                        let previous = releases[i + 1];
                        theThis.compareReleases(
                            theThis.appId,
                            theThis.profileId,
                            current.version,
                            previous.version,
                            function (difference) {
                                current.difference = difference;
                                current.changes = theThis.extractChanges(current.properties, previous.properties, difference);
                            });
                    }
                    if (releases.length > 0) {
                        let current = releases[releases.length - 1];
                        theThis.doQueryReleases(
                            theThis.queryReleasesForm.pageNo + 1,
                            theThis.queryReleasesForm.pageSize,
                            theThis.appId,
                            theThis.profileId,
                            function (nextTotalCount, nextReleases) {
                                let previous;
                                if (nextReleases.length > 0) {
                                    previous = nextReleases[0];
                                } else {
                                    previous = {
                                        appId: theThis.appId,
                                        profileId: theThis.profileId,
                                        version: 0,
                                        releaseTime: new Date().getTime(),
                                        memo: '原始发布',
                                        properties: []
                                    };
                                }
                                previous.properties.forEach(function (property) {
                                    property.privilege = theThis.calcPrivilege(previous.appId, property.key);
                                });
                                theThis.compareReleases(
                                    theThis.appId,
                                    theThis.profileId,
                                    current.version,
                                    previous.version,
                                    function (difference) {
                                        current.difference = difference;
                                        current.changes = theThis.extractChanges(current.properties, previous.properties, difference);
                                    });
                            }
                        );
                    }

                    theThis.releases = releases;
                }
            );
        },
        doQueryReleases: function (pageNo, pageSize, appId, profileId, callback) {
            axios.get('../manage/release/queryReleases', {
                params: {
                    pageNo: pageNo,
                    pageSize: pageSize,
                    appId: appId,
                    profileId: profileId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                }
                callback(result.totalCount, result.infos);
            });
        },
        compareReleases: function (appId, profileId, leftVersion, rightVersion, callback) {
            axios.get('../manage/release/compareReleases', {
                params: {
                    appId: appId,
                    profileId: profileId,
                    leftVersion: leftVersion,
                    rightVersion: rightVersion
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                }
                callback(result.difference);
            });
        },
        extractChanges: function (leftProperties, rightProperties, difference) {
            let leftMap = {};
            leftProperties.forEach(function (property) {
                leftMap[property.key] = property;
            });
            let rightMap = {};
            rightProperties.forEach(function (property) {
                rightMap[property.key] = property;
            });

            let keys = [];
            let temp = difference.addedKeys.concat(
                difference.modifiedValueKeys,
                difference.modifiedScopeKeys,
                difference.removedKeys);
            temp.forEach(function (key) {
                if (keys.indexOf(key) < 0) {
                    keys.push(key);
                }
            });

            let changes = [];
            keys.forEach(function (key) {
                changes.push({
                    key: key,
                    current: leftMap[key],
                    previous: rightMap[key]
                });
            });

            return changes;
        },
        findCurrentRelease: function () {
            const theThis = this;
            axios.get('../manage/release/findCurrentRelease', {
                params: {
                    appId: this.appId,
                    profileId: this.profileId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.currentRelease = result.release;
            });
        },
        findApp: function (appId) {
            const theThis = this;
            axios.get('../manage/app/findApp', {
                params: {
                    appId: appId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.app = result.app;
            });
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
        },
        findProfile: function (profileId) {
            const theThis = this;
            axios.get('../manage/profile/findProfile', {
                params: {
                    profileId: profileId
                }
            }).then(function (result) {
                if (!result.success) {
                    Vue.prototype.$message.error(result.message);
                    return;
                }
                theThis.profile = result.profile;
            });
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
        changeShowingRelease: function (row) {
            this.showingRelease = row;
        },
        revertRelease: function (release) {
            const theThis = this;
            Vue.prototype.$confirm('回滚后，应用的配置将会采用此版本，且大于此版本的发布将会被删除。确定回滚？', '警告', {type: 'warning'})
                .then(function () {
                    axios.post('../manage/release/revertRelease', {
                        appId: release.appId,
                        profileId: release.profileId,
                        targetVersion: release.version
                    }).then(function (result) {
                        if (!result.success) {
                            Vue.prototype.$message.error(result.message);
                            return;
                        }
                        Vue.prototype.$message.success(result.message);
                        theThis.queryReleasesForm.pageNo = 1;
                        theThis.queryReleases();
                    });
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
        currentReleaseClassName: function ({row, rowIndex}) {
            if (this.currentRelease && row.version === this.currentRelease.version) {
                return 'current-release-row';
            }
            return '';
        }
    }
};