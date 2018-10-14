import {Card, CardContent, Grid, Typography, withStyles} from "material-ui";
import React from "react";

const styles = theme => ({
    root: {
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        padding: theme.spacing.unit / 2,
    },
    title: {
        marginBottom: 16,
        fontSize: 14,
    },
    pos: {
        marginBottom: 12,
    },
    card: {
        height:140,
        width:140
    }
});


class InfoCard extends React.Component {

    constructor(props) {
        super(props);

        this.type = props.type;
        this.value = props.value;
        this.optional = props.optional;
    }

    render() {
        const { classes } = this.props;

        return (
            <Grid item>
                <Card className={classes.card}>
                    <CardContent>
                        <Typography className={classes.title} color="textSecondary">
                            {this.type}
                        </Typography>
                        <Typography variant="h5">
                            {this.value}
                        </Typography>
                        <Typography className={classes.pos} color="textSecondary">
                            {this.optional}
                        </Typography>
                    </CardContent>
                </Card>
            </Grid>
        );
    }
}

export default withStyles(styles)(InfoCard);