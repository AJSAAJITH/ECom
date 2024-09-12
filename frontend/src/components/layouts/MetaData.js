import { Helmet } from "react-helmet-async"

export default function MetaData({title}) {
    return (
        <Helmet>
            <link rel="icon" href="/images/ecom-logo.png"/>
            <title>{`${title} - JVLcart`}</title>
        </Helmet>
    )
}