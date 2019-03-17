/* 
 * 作者：钟勋 (e-mail:zhongxunking@163.com)
 */

/*
 * 修订记录:
 * @author 钟勋 2018-12-08 22:40 创建
 */
package org.antframework.configcenter.facade.order;

import lombok.Getter;
import lombok.Setter;
import org.antframework.common.util.facade.AbstractOrder;
import org.antframework.common.util.tostring.format.Mask;
import org.antframework.configcenter.facade.vo.Scope;
import org.hibernate.validator.constraints.NotBlank;

import javax.validation.constraints.NotNull;

/**
 * 新增或修改配置value-order
 */
@Getter
@Setter
public class AddOrModifyPropertyValueOrder extends AbstractOrder {
    // 应用id
    @NotBlank
    private String appId;
    // key
    @NotBlank
    private String key;
    // 环境id
    @NotBlank
    private String profileId;
    // value
    @NotBlank
    @Mask(allMask = true)
    private String value;
    // 作用域
    @NotNull
    private Scope scope;
}
