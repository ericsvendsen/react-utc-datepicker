import React, {Component} from 'react';
import PropTypes from 'prop-types';
import 'shim-keyboard-event-key';
import * as moment from 'moment';

import 'font-awesome/css/font-awesome.css';
import './ReactUTCDatepicker.css';

class ReactUTCDatepicker extends Component {
    constructor(props) {
        super(props);

        this.state = {
            date: props.date,
            button: typeof props.button === 'undefined' ? true : props.button,
            buttonPosition: props.buttonPosition || 'after',
            showCalendar: false,
            days: [],
            dayNames: [],
            inputText: '', // keep track of the actual text of the input field
            tempDate: null, // moment object used for keeping track while cycling through months
            calendarTitle: '',
            calendarPosition: 'react-utc-datepicker_below'
        };

        this._getMomentDate = this._getMomentDate.bind(this);
        this._generateCalendar = this._generateCalendar.bind(this);
        this._generateDayNames = this._generateDayNames.bind(this);
        this._openCalendar = this._openCalendar.bind(this);
        this._closeCalendar = this._closeCalendar.bind(this);
        this._prevMonth = this._prevMonth.bind(this);
        this._nextMonth = this._nextMonth.bind(this);
        this._selectDate = this._selectDate.bind(this);
        this._selectToday = this._selectToday.bind(this);
        this._keydown = this._keydown.bind(this);
        this._onDateChange = this._onDateChange.bind(this);
    }

    _getMomentDate(date) {
        if (!moment.utc(date, this.props.format).isValid()) {
            date = moment.utc().format(this.props.format);
        }
        return moment.utc(date, this.props.format);
    };

    _generateCalendar(date) {
        const days = [];

        const lastMonth = moment.utc(date).subtract(1, 'M'),
            nextMonth = moment.utc(date).add(1, 'M'),
            month = moment.utc(date).month() + 1,
            year = moment.utc(date).year(),
            firstWeekDay = 1 - moment.utc(date).startOf('M').isoWeekday(),
            totalDays = (42 + firstWeekDay) - 1; // 7 columns X 6 rows

        for (let i = firstWeekDay; i <= totalDays; i++) {
            if (i > 0 && i <= moment.utc(date).endOf('M').date()) {
                // current month
                days.push({
                    day: i,
                    month: month,
                    year: year,
                    enabled: 'react-utc-datepicker_enabled',
                    selected: moment.utc(this.state.date, this.props.format).isSame(moment.utc(year + '-' + month + '-' + i, 'YYYY-M-D'), 'day') ?
                        'react-utc-datepicker_selected' :
                        'react-utc-datepicker_unselected'
                });
            } else if (i > moment.utc(date).endOf('M').date()) {
                // next month
                days.push({
                    day: i - date.endOf('M').date(),
                    month: nextMonth.month() + 1,
                    year: nextMonth.year(),
                    enabled: 'react-utc-datepicker_disabled',
                    selected: 'react-utc-datepicker_unselected'
                });
            } else {
                // last month
                days.push({
                    day: lastMonth.endOf('M').date() - (0 - i),
                    month: lastMonth.month() + 1,
                    year: lastMonth.year(),
                    enabled: 'react-utc-datepicker_disabled',
                    selected: 'react-utc-datepicker_unselected'
                });
            }
        }

        this.setState({
            days: days,
            calendarTitle: moment.utc(this.state.tempDate, this.format).format('MMMM YYYY')
        });
    }

    _generateDayNames() {
        const dayNames = [];
        const date = moment('2017-04-02'); // sunday
        for (let i = 0; i < 7; i++) {
            dayNames.push(date.format('ddd'));
            date.add('1', 'd');
        }

        this.setState({
            dayNames: dayNames
        });
    }

    _openCalendar(event) {
        const rect = event.target.getBoundingClientRect();
        setTimeout(() => {
            const calendarPosition = window.innerHeight - rect.bottom < 250 ?
                'react-utc-datepicker_above' :
                'react-utc-datepicker_below';
            this.setState({
                showCalendar: true,
                calendarPosition: calendarPosition
            }, () => {
                this._generateCalendar(this._getMomentDate(this.state.tempDate));
            });
        }, 50)
    }

    _closeCalendar() {
        setTimeout(() => {
            if (document.activeElement) {
                const hasPopupClass = document.activeElement.className.includes('react-utc-datepicker_calendar-popup');
                this.setState({
                    showCalendar: hasPopupClass,
                    tempDate: this._getMomentDate(this.state.date)
                }, () => {
                    if (!this.state.showCalendar) {
                        this.calendarTitle = this._getMomentDate(this.state.date).format('MMMM YYYY');
                        if (this.state.inputText && this.state.inputText !== this.state.date) {
                            this.el.nativeElement.value = this.state.date;
                        }
                        const isValid = moment.utc(this.state.date, this.props.format).format(this.props.format) === this.state.date;
                        if (!isValid) {
                            this.props.onChange('Invalid date');
                        }
                    }
                });
            }
        }, 50);
    }

    _prevMonth() {
        const prev = moment.utc(this.state.tempDate).subtract(1, 'M');
        this.setState({
            tempDate: prev,
            calendarTitle: prev.format('MMMM YYYY')
        }, () => {
            this._generateCalendar(this.state.tempDate);
        });

    };

    _nextMonth() {
        const next = moment.utc(this.state.tempDate).add(1, 'M');
        this.setState({
            tempDate: next,
            calendarTitle: next.format('MMMM YYYY')
        }, () => {
            this._generateCalendar(this.state.tempDate);
        });
    };

    _selectDate(date) {
        const currDate = moment.utc(this.state.date, this.props.format);
        const selectedDate = moment.utc(`${date.year}-${date.month}-${date.day} ${currDate.hour()}:${currDate.minute()}:
            ${currDate.second()}`, 'YYYY-M-D HH:mm:ss');
        const formattedDate = selectedDate.format(this.props.format);
        this.setState({
            date: formattedDate,
            tempDate: this._getMomentDate(formattedDate),
            calendarTitle: this.state.tempDate.format('MMMM YYYY'),
            showCalendar: false
        }, () => {
            this._generateCalendar(this.state.tempDate);
            this.props.onChange(formattedDate);
        });
    };

    _selectToday() {
        const today = moment.utc();
        const date = {
            day: today.date(),
            month: today.month() + 1,
            year: today.year(),
            enabled: 'react-utc-datepicker_enabled',
            selected: 'react-utc-datepicker_selected'
        };
        this._selectDate(date);
    };

    _keydown(event) {
        if (event.key === 'Escape') {
            this.setState({
                showCalendar: false
            });
        }
    };

    _onDateChange(event) {
        const isValid = moment.utc(event.target.value, this.props.format).format(this.props.format) === event.target.value;
        const title = isValid ? moment.utc(event.target.value, this.format).format('MMMM YYYY') : this.state.calendarTitle;
        this.setState({
            date: event.target.value,
            inputText: event.target.value,
            calendarTitle: title
        }, () => {
            if (isValid) {
                this._generateCalendar(this._getMomentDate(this.state.date));
                this.props.onChange(this.state.date);
            }
        });
    };

    componentDidMount() {
        let date = this.props.date;
        if (typeof date === 'object') {
            // date was passed in as a JS Date object
            date = moment.utc(date).format(this.props.format);
        } else {
            const isValid = moment.utc(date, this.props.format).format(this.props.format) === date;
            if (!isValid) {
                // date does not match format, so try to force it
                date = moment.utc(date).format(this.props.format);
                if (!moment.utc(date).isValid()) {
                    // moment is unable to parse the string
                    throw new Error('Invalid date string specified');
                }
            }
        }
        this.setState({
            date: date,
            calendarTitle: this._getMomentDate(this.state.date).format('MMMM YYYY'),
            tempDate: this._getMomentDate(this.state.date)
        }, () => {
            if (this.state.dayNames.length === 0) {
                this._generateDayNames();
            }
        });
    }

    componentDidUpdate(prevProps) {
        if (prevProps.date !== this.props.date || prevProps.format !== this.props.format) {
            this.setState({
                date: this.props.date,
                format: this.props.format
            });
        }
    }

    render() {
        const dayNameEls = [];
        this.state.dayNames.forEach((name, idx) => {
            dayNameEls.push(<div className="react-utc-datepicker_name" key={idx}>{name}</div>);
        });

        const dayEls = [];
        this.state.days.forEach((day, idx) => {
            dayEls.push(
                <div
                    className={`react-utc-datepicker_day ${day.selected} ${day.enabled}`}
                    onClick={() => this._selectDate(day)}
                    key={idx}
                >
                    {day.day}
                </div>
            );
        });

        const button = <button
            className={`react-utc-datepicker_button ${this.state.buttonPosition}`}
            onClick={this._openCalendar}
            onBlur={this._closeCalendar}
            onKeyDown={this._keydown}
        >
            <i className="fa fa-calendar"/>
        </button>;

        let buttonBefore = null;
        let buttonAfter = null;
        if (this.state.button && this.state.buttonPosition === 'before') {
            buttonBefore = button;
        } else if (this.state.button && this.state.buttonPosition === 'after') {
            buttonAfter = button;
        }

        const calendarPopupEl = this.state.showCalendar ?
            <div
                className={`react-utc-datepicker_calendar-popup ${this.state.calendarPosition}`}
                onBlur={this._closeCalendar}
                onKeyDown={this._keydown}
                tabIndex="0"
            >
                <div className="react-utc-datepicker_calendar-controls">
                    <div
                        className="react-utc-datepicker_prev"
                        onClick={this._prevMonth}
                        onKeyDown={this._keydown}
                    >
                        <i className="fa fa-arrow-left"/>
                    </div>
                    <div className="react-utc-datepicker_title">
                        {this.state.calendarTitle}
                        <span
                            className="react-utc-datepicker_today"
                            title="Today"
                            onClick={this._selectToday}
                            onKeyDown={this._keydown}
                        >
                                    <i className="fa fa-calendar-o"/>
                                </span>
                    </div>
                    <div
                        className="react-utc-datepicker_next"
                        onClick={this._nextMonth}
                        onKeyDown={this._keydown}
                    >
                        <i className="fa fa-arrow-right"/>
                    </div>
                </div>
                <div className="react-utc-datepicker_day-names">
                    {dayNameEls}
                </div>
                <div className="react-utc-datepicker_calendar">
                    {dayEls}
                    <div className="react-utc-datepicker_clear"/>
                </div>
            </div> :
            null;


        return(
            <div className="react-utc-datepicker-container">
                {buttonBefore}
                <input
                    ref={r => (this.el = r)}
                    className="react-utc-datepicker_input"
                    onChange={this._onDateChange}
                    onFocus={this._openCalendar}
                    onBlur={this._closeCalendar}
                    onKeyDown={this._keydown}
                    value={this.state.date}
                />
                {buttonAfter}
                <div className="react-utc-datepicker_datepicker">
                    {calendarPopupEl}
                </div>
            </div>
        )
    }
}

ReactUTCDatepicker.propTypes = {
    date: PropTypes.string,
    format: PropTypes.string,
    button: PropTypes.bool,
    buttonPosition: PropTypes.string,
    onChange: PropTypes.func
};

export default ReactUTCDatepicker;
