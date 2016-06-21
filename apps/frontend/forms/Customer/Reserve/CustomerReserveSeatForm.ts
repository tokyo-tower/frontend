import BaseForm from '../../BaseForm';

export default class CustomerReserveSeatForm extends BaseForm {
    public constructor() {
        super();

        let fields = this.forms.fields;
        let validators = this.forms.validators;
        let widgets = this.forms.widgets;

        this.form = this.forms.create(
            {
                stockIds: fields.string({
                    label: '在庫IDリスト',
                    widget: widgets.hidden(),
                    required: true,
                    validators: [
                    ]
                })
            },
            this.options
        );
    }
}
